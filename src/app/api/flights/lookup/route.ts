import { NextRequest, NextResponse } from "next/server";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

interface AeroAirport {
  iata?: string;
  icao?: string;
  name?: string;
  municipalityName?: string;
  countryCode?: string;
}

interface AeroFlightItem {
  number?: string;
  airline?: {
    name?: string;
    iata?: string;
    icao?: string;
  };
  aircraft?: {
    model?: string;
    reg?: string;
  };
  departure?: {
    airport?: AeroAirport;
    scheduledTime?: {
      local?: string;
      utc?: string;
    };
    terminal?: string;
    gate?: string;
  };
  arrival?: {
    airport?: AeroAirport;
    scheduledTime?: {
      local?: string;
      utc?: string;
    };
    terminal?: string;
    gate?: string;
  };
  status?: string;
}

function extractTimeFromLocalString(timeStr?: string): string {
  if (!timeStr) return "";
  // Format typically "2026-09-18 10:15+02:00" or "2026-09-18T10:15:00"
  const match = timeStr.match(/(\d{2}:\d{2})/);
  return match ? match[1] : "";
}

export async function GET(req: NextRequest) {
  if (!RAPIDAPI_KEY) {
    return NextResponse.json(
      {
        success: false,
        error: "Variable de entorno RAPIDAPI_KEY no configurada en .env.",
      },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const flightNumber = searchParams.get("flightNumber")?.trim();
  const date = searchParams.get("date")?.trim(); // Expected format YYYY-MM-DD

  if (!flightNumber) {
    return NextResponse.json(
      { error: "El parámetro flightNumber es obligatorio." },
      { status: 400 }
    );
  }

  const cleanFlight = flightNumber.replace(/\s+/g, "").toUpperCase();

  try {
    // 1. PRIMER INTENTO: AeroDataBox con fecha específica (si se proporciona)
    let aeroData: AeroFlightItem[] | null = null;

    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      try {
        const resWithDate = await fetch(
          `https://aerodatabox.p.rapidapi.com/flights/number/${encodeURIComponent(cleanFlight)}/${encodeURIComponent(date)}`,
          {
            headers: {
              "x-rapidapi-key": RAPIDAPI_KEY,
              "x-rapidapi-host": "aerodatabox.p.rapidapi.com",
            },
            next: { revalidate: 3600 },
          }
        );

        if (resWithDate.status === 200) {
          const parsed = await resWithDate.json();
          if (Array.isArray(parsed) && parsed.length > 0) {
            aeroData = parsed;
          }
        }
      } catch (err) {
        console.warn("Error en AeroDataBox con fecha:", err);
      }
    }

    // 2. SEGUNDO INTENTO: AeroDataBox sin fecha (para recuperar la ruta operativa y horarios habituales)
    if (!aeroData) {
      try {
        const resWithoutDate = await fetch(
          `https://aerodatabox.p.rapidapi.com/flights/number/${encodeURIComponent(cleanFlight)}`,
          {
            headers: {
              "x-rapidapi-key": RAPIDAPI_KEY,
              "x-rapidapi-host": "aerodatabox.p.rapidapi.com",
            },
            next: { revalidate: 3600 },
          }
        );

        if (resWithoutDate.status === 200) {
          const parsed = await resWithoutDate.json();
          if (Array.isArray(parsed) && parsed.length > 0) {
            aeroData = parsed;
          }
        }
      } catch (err) {
        console.warn("Error en AeroDataBox sin fecha:", err);
      }
    }

    // Si AeroDataBox devolvió resultados válidos:
    if (aeroData && aeroData.length > 0) {
      const flight = aeroData[0];
      const depAirport = flight.departure?.airport;
      const arrAirport = flight.arrival?.airport;

      const originCode = depAirport?.iata || depAirport?.icao || "";
      const originName =
        depAirport?.municipalityName || depAirport?.name || "Origen";
      const originFormatted = originCode
        ? `${originName} (${originCode})`
        : originName;

      const destCode = arrAirport?.iata || arrAirport?.icao || "";
      const destName =
        arrAirport?.municipalityName || arrAirport?.name || "Destino";
      const destFormatted = destCode
        ? `${destName} (${destCode})`
        : destName;

      const depTime = extractTimeFromLocalString(
        flight.departure?.scheduledTime?.local ||
          flight.departure?.scheduledTime?.utc
      );
      const arrTime = extractTimeFromLocalString(
        flight.arrival?.scheduledTime?.local ||
          flight.arrival?.scheduledTime?.utc
      );

      return NextResponse.json({
        success: true,
        source: "aerodatabox",
        flightNumber: flight.number || cleanFlight,
        airline: flight.airline?.name || "",
        airlineIata: flight.airline?.iata || "",
        origin: originFormatted,
        originIata: originCode,
        originCity: originName,
        departureTime: depTime,
        departureTerminal: flight.departure?.terminal || "",
        destination: destFormatted,
        destinationIata: destCode,
        destinationCity: destName,
        arrivalTime: arrTime,
        arrivalTerminal: flight.arrival?.terminal || "",
        aircraftModel: flight.aircraft?.model || "",
        status: flight.status || "Programado",
      });
    }

    // 3. TERCER INTENTO (FALLBACK): Google Flights 2 si AeroDataBox no encontró y se proporcionan origen y destino
    const originParam = searchParams.get("origin")?.trim();
    const destParam = searchParams.get("destination")?.trim();

    if (!aeroData && originParam && destParam && date) {
      try {
        // Extraer códigos IATA de strings como "Madrid (MAD)" o "MAD"
        const originCode = originParam.match(/\b([A-Z]{3})\b/i)?.[1]?.toUpperCase() || originParam.slice(0, 3).toUpperCase();
        const destCode = destParam.match(/\b([A-Z]{3})\b/i)?.[1]?.toUpperCase() || destParam.slice(0, 3).toUpperCase();

        const gfUrl = `https://google-flights2.p.rapidapi.com/api/v1/searchFlights?departure_id=${encodeURIComponent(originCode)}&arrival_id=${encodeURIComponent(destCode)}&outbound_date=${encodeURIComponent(date)}&currency=EUR`;
        const gfRes = await fetch(gfUrl, {
          headers: {
            "x-rapidapi-key": RAPIDAPI_KEY,
            "x-rapidapi-host": "google-flights2.p.rapidapi.com",
          },
          next: { revalidate: 3600 },
        });

        if (gfRes.ok) {
          const gfData = await gfRes.json();
          const topFlights = gfData?.data?.itineraries?.topFlights || gfData?.data?.itineraries?.otherFlights || [];
          if (Array.isArray(topFlights) && topFlights.length > 0) {
            // Buscar un vuelo que coincida con el número de vuelo o tomar el primero
            let matchedItinerary = topFlights[0];
            for (const item of topFlights) {
              const flights = item.flights || [];
              const found = flights.some((f: any) =>
                f.flight_number?.toUpperCase().includes(cleanFlight) ||
                cleanFlight.includes(f.flight_number?.toUpperCase())
              );
              if (found) {
                matchedItinerary = item;
                break;
              }
            }

            const firstLeg = matchedItinerary.flights?.[0];
            const lastLeg = matchedItinerary.flights?.[matchedItinerary.flights.length - 1] || firstLeg;

            if (firstLeg) {
              const depTime = extractTimeFromLocalString(firstLeg.departure_airport?.time);
              const arrTime = extractTimeFromLocalString(lastLeg.arrival_airport?.time);
              const airlineName = firstLeg.airline || "";

              return NextResponse.json({
                success: true,
                source: "google-flights2",
                flightNumber: firstLeg.flight_number || cleanFlight,
                airline: airlineName,
                origin: `${firstLeg.departure_airport?.airport_name || originCode} (${firstLeg.departure_airport?.airport_code || originCode})`,
                originIata: firstLeg.departure_airport?.airport_code || originCode,
                departureTime: depTime,
                destination: `${lastLeg.arrival_airport?.airport_name || destCode} (${lastLeg.arrival_airport?.airport_code || destCode})`,
                destinationIata: lastLeg.arrival_airport?.airport_code || destCode,
                arrivalTime: arrTime,
                aircraftModel: firstLeg.airplane || "",
                status: "Confirmado",
              });
            }
          }
        }
      } catch (gfErr) {
        console.warn("Error en fallback de google-flights2:", gfErr);
      }
    }

    // Si ninguna devolvió datos para ese número de vuelo
    return NextResponse.json(
      {
        success: false,
        message: `No se han encontrado registros para el vuelo ${cleanFlight}. Comprueba el código o introduce los datos manualmente.`,
      },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error al consultar API de vuelos:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error interno al consultar el servicio de vuelos.",
      },
      { status: 500 }
    );
  }
}
