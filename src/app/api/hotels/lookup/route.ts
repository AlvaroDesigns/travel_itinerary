import { NextRequest, NextResponse } from "next/server";

interface OsmAddress {
  road?: string;
  house_number?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

interface OsmPlace {
  place_id: number;
  osm_type: string;
  osm_id: number;
  display_name: string;
  name?: string;
  namedetails?: Record<string, string>;
  class?: string;
  type?: string;
  address?: OsmAddress;
  extratags?: Record<string, string>;
  lat?: string;
  lon?: string;
}

/**
 * Normaliza y formatea la dirección a partir de los campos detallados de OpenStreetMap
 */
function formatOsmAddress(address?: OsmAddress, fallbackDisplayName?: string): string {
  if (!address) return fallbackDisplayName || "";

  const streetPart = [address.road, address.house_number].filter(Boolean).join(" ");
  const cityPart = address.city || address.town || address.village || address.municipality || address.county || "";
  const postalPart = address.postcode || "";
  const countryPart = address.country || "";

  const parts: string[] = [];
  if (streetPart) parts.push(streetPart);
  if (cityPart && postalPart) parts.push(`${postalPart} ${cityPart}`);
  else if (cityPart) parts.push(cityPart);
  if (countryPart) parts.push(countryPart);

  if (parts.length > 0) {
    return parts.join(", ");
  }

  return fallbackDisplayName || "";
}

/**
 * Consulta Wikipedia/Wikimedia para obtener una descripción concisa y una foto en alta resolución
 */
async function fetchWikiDetails(
  query: string
): Promise<{ description: string; photoUrl: string } | null> {
  try {
    const searchUrl = `https://es.wikipedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=${encodeURIComponent(
      query
    )}&gsrlimit=1&prop=pageimages|extracts&exintro=1&explaintext=1&pithumbsize=1200`;

    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent": "WanderlustTravelApp/1.0 (info.alvarodesigns@gmail.com)",
      },
      next: { revalidate: 86400 },
    });

    if (res.ok) {
      const data = await res.json();
      const pages = data?.query?.pages;
      if (pages) {
        const firstKey = Object.keys(pages)[0];
        const page = pages[firstKey];
        const description = page?.extract?.slice(0, 320)?.trim() || "";
        const photoUrl = page?.thumbnail?.source || "";

        if (description || photoUrl) {
          return { description, photoUrl };
        }
      }
    }

    // Fallback a Wikipedia en inglés si en español no hay resultados
    const enSearchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=${encodeURIComponent(
      query
    )}&gsrlimit=1&prop=pageimages|extracts&exintro=1&explaintext=1&pithumbsize=1200`;

    const enRes = await fetch(enSearchUrl, {
      headers: {
        "User-Agent": "WanderlustTravelApp/1.0 (info.alvarodesigns@gmail.com)",
      },
      next: { revalidate: 86400 },
    });

    if (enRes.ok) {
      const enData = await enRes.json();
      const pages = enData?.query?.pages;
      if (pages) {
        const firstKey = Object.keys(pages)[0];
        const page = pages[firstKey];
        const description = page?.extract?.slice(0, 320)?.trim() || "";
        const photoUrl = page?.thumbnail?.source || "";

        if (description || photoUrl) {
          return { description, photoUrl };
        }
      }
    }
  } catch (err) {
    console.warn("Error consultando Wikipedia:", err);
  }

  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query")?.trim();
  const cityContext = searchParams.get("city")?.trim() || "";

  if (!query) {
    return NextResponse.json(
      { success: false, message: "El parámetro query es obligatorio." },
      { status: 400 }
    );
  }

  try {
    // 1. Buscar en OpenStreetMap / Nominatim
    const searchTerms = [query, cityContext].filter(Boolean).join(" ");
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      searchTerms
    )}&format=json&addressdetails=1&extratags=1&namedetails=1&limit=5`;

    let places: OsmPlace[] = [];
    try {
      const osmRes = await fetch(nominatimUrl, {
        headers: {
          "User-Agent": "WanderlustTravelApp/1.0 (info.alvarodesigns@gmail.com)",
          "Accept-Language": "es,en;q=0.9",
        },
        next: { revalidate: 3600 },
      });

      if (osmRes.ok) {
        places = await osmRes.json();
      }
    } catch (osmErr) {
      console.warn("Nominatim fetch error:", osmErr);
    }

    // Si no hubo resultados con ciudad, probar solo con el nombre del hotel
    if (places.length === 0 && cityContext) {
      try {
        const fallbackUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json&addressdetails=1&extratags=1&namedetails=1&limit=5`;
        const osmRes2 = await fetch(fallbackUrl, {
          headers: {
            "User-Agent": "WanderlustTravelApp/1.0 (info.alvarodesigns@gmail.com)",
            "Accept-Language": "es,en;q=0.9",
          },
          next: { revalidate: 3600 },
        });
        if (osmRes2.ok) {
          places = await osmRes2.json();
        }
      } catch (e) {
        // ignore
      }
    }

    // Priorizar resultados catalogados como tourism=hotel/resort/guest_house
    let selectedPlace: OsmPlace | null = null;
    if (places && places.length > 0) {
      const tourismMatch = places.find(
        (p) =>
          p.class === "tourism" ||
          p.type === "hotel" ||
          p.type === "resort" ||
          p.type === "motel" ||
          p.type === "guest_house" ||
          p.type === "apartment"
      );
      selectedPlace = tourismMatch || places[0];
    }

    // Datos extraídos de OSM
    const resolvedName =
      selectedPlace?.namedetails?.["name:es"] ||
      selectedPlace?.namedetails?.name ||
      selectedPlace?.name ||
      query;

    const formattedAddress = selectedPlace
      ? formatOsmAddress(selectedPlace.address, selectedPlace.display_name)
      : [query, cityContext].filter(Boolean).join(", ");

    const detectedCity =
      selectedPlace?.address?.city ||
      selectedPlace?.address?.town ||
      selectedPlace?.address?.village ||
      selectedPlace?.address?.municipality ||
      cityContext ||
      "";

    const detectedCountry = selectedPlace?.address?.country || "";

    // Estrellas / Categoría
    let stars: number | null = null;
    const rawStars = selectedPlace?.extratags?.stars;
    if (rawStars && !isNaN(Number(rawStars))) {
      stars = Math.min(5, Math.max(1, parseInt(rawStars, 10)));
    }

    // Website / Contacto
    const website =
      selectedPlace?.extratags?.website ||
      selectedPlace?.extratags?.["contact:website"] ||
      "";
    const phone =
      selectedPlace?.extratags?.phone ||
      selectedPlace?.extratags?.["contact:phone"] ||
      "";

    // 2. Buscar imagen y descripción en Wikipedia / Wikimedia
    const wikiDetails = await fetchWikiDetails(
      `${resolvedName} ${detectedCity}`.trim()
    );

    // Fallback de imagen con Unsplash específico para hoteles de alta gama si Wikipedia no tiene imagen
    const finalPhotoUrl =
      wikiDetails?.photoUrl ||
      `https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80`;

    // Descripción formateada
    const finalDescription =
      wikiDetails?.description ||
      (stars
        ? `Hotel ${stars} estrellas ubicado en ${detectedCity || formattedAddress}. Recepción 24h, confort y servicios prémium.`
        : `Alojamiento selecto ubicado en ${detectedCity || formattedAddress}. Experiencia de descanso y servicios garantizados.`);

    return NextResponse.json({
      success: true,
      source: selectedPlace ? "osm_nominatim" : "smart_lookup",
      hotelName: resolvedName,
      address: formattedAddress,
      city: detectedCity,
      country: detectedCountry,
      stars: stars || (query.toLowerCase().includes("luxury") || query.toLowerCase().includes("grand") ? 5 : 4),
      photoUrl: finalPhotoUrl,
      description: finalDescription,
      checkInTime: "15:00",
      checkOutTime: "11:00",
      website,
      phone,
    });
  } catch (error) {
    console.error("Error en lookup de hotel:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al procesar la solicitud de autocompletado de hotel.",
      },
      { status: 500 }
    );
  }
}
