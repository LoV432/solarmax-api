import getSignKey from "./sign";
import { DateTime } from "luxon";
import { errorCodes } from "./errorCodes";
import type { Logs, Battery } from "./types.d.ts";
import dotenv from "dotenv";
dotenv.config();
const { USERNAME, PASSWORD, GOODSTYPEID, GOODSID, TIMEZONE, DISCORD_WEBHOOK } =
  process.env;

export async function discordBatteryMessage(
  currentSOC: number,
  thresholdSOC: number,
  status: string
) {
  if (!DISCORD_WEBHOOK) {
    console.log("No discord webhook set");
    return;
  }
  let errorMessage = "";
  if (status === "1") {
    errorMessage = `🔋 Battery reached back to ${thresholdSOC}%`;
  } else {
    errorMessage = `🪫 Battery dropped below ${thresholdSOC}%`;
  }

  const options = {
    method: "POST",
    body: `${errorMessage}\n\n     Current Battery SOC: ${currentSOC}%`,
    headers: {
      Title: `SolarMax - Battery Update`,
      Priority: "default",
    },
  };

  await safeFetch(DISCORD_WEBHOOK, options);
  console.log(JSON.stringify(options));
}

export async function discordLogsMessage(errorCode: string, status: string) {
  if (!DISCORD_WEBHOOK) {
    console.log("No discord webhook set");
    return;
  }
  let errorMessage = "";
  switch (errorCode) {
    case "2":
      errorMessage =
        status === "1"
          ? "⚡️✅ Grid power outage ended"
          : "⚡️❌ Gird power outage started - Everything is on UPS now";
      break;

    case "50":
      errorMessage =
        status === "1"
          ? "🔋 Battery is now alive"
          : "🪫 Low battery - Everything is on grid now";
      break;

    default:
      errorMessage =
        status === "1"
          ? `${errorCodes[errorCode]} inactive`
          : `${errorCodes[errorCode]} active`;
      break;
  }

  const options = {
    method: "POST",
    body: `${errorMessage}`,
    headers: {
      Title: `SolarMax - Notification`,
      Priority: "default",
    },
  };

  await safeFetch(DISCORD_WEBHOOK, options);
  console.log(JSON.stringify(options));
}

export async function getToken() {
  let body = {
    sign: getSignKey({
      MemberID: USERNAME,
      Password: PASSWORD,
      remember: true,
      type: 1,
    }),
    MemberID: USERNAME,
    Password: PASSWORD,
    remember: true,
    type: 1,
  };

  const request = await safeFetch(
    "https://www.cloudinverter.net/dist/server/api/CodeIgniter/index.php/Senergytec/web/v2/Inverterapi/UserLogin",
    {
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      method: "POST",
    }
  );
  if (!request.success) {
    return "";
  }
  const requestBody = (await request.response.json()) as { token: string };
  return requestBody.token;
}

export async function getLogs(token: string) {
  const date = DateTime.utc().setZone(TIMEZONE).toFormat("yyyy-MM-dd");
  const body = {
    sign: getSignKey({
      MemberID: USERNAME,
      GoodsTypeId: Number(GOODSTYPEID),
      selectType: 1,
      SDate: date,
      EDate: date,
    }),
    MemberID: USERNAME,
    GoodsTypeId: Number(GOODSTYPEID),
    selectType: 1,
    SDate: date,
    EDate: date,
  };

  const fetchBody = {
    headers: {
      authorization: token,
      "content-type": "application/json",
      Cookie: `timezone=${TIMEZONE}`,
    },
    body: JSON.stringify(body),
    method: "POST",
  };
  const request = await safeFetch(
    "https://www.cloudinverter.net/dist/server/api/CodeIgniter/index.php/Senergytec/web/v2/Inverterapi/logsearch",
    fetchBody
  );
  if (!request.success) {
    return { total_error_num: 0, infoerror: [] };
  }
  const requestBody = (await request.response.json()) as Logs;
  //console.log(requestBody);
  return requestBody;
}

export async function getBatteryPercent(token: string) {
  const body = {
    sign: getSignKey({
      GoodsTypeId: Number(GOODSTYPEID),
      GoodsID: GOODSID,
    }),
    GoodsTypeId: Number(GOODSTYPEID),
    GoodsID: GOODSID,
  };

  const fetchBody = {
    headers: {
      authorization: token,
      "content-type": "application/json",
      Cookie: `timezone=${TIMEZONE}`,
    },
    body: JSON.stringify(body),
    method: "POST",
  };
  const request = await safeFetch(
    "https://www.cloudinverter.net/dist/server/api/CodeIgniter/index.php/Senergytec/web/v2/Inverterapi/getHybridFlowgraph",
    fetchBody
  );
  if (!request.success) {
    return { SOC: -1 };
  }
  const requestBody = (await request.response.json()) as Battery;
  //console.log(requestBody);
  return requestBody;
}

export function convertToUTC(dateTimeString: string) {
  const dateTimeInZone = DateTime.fromFormat(
    dateTimeString,
    "yyyy-MM-dd HH:mm:ss",
    { zone: TIMEZONE }
  );

  // Convert to UTC
  const utcDateTime = dateTimeInZone.toUTC();
  if (!utcDateTime.isValid) {
    console.log("Invalid date-time:", dateTimeString);
    return null;
  }
  return utcDateTime;
}

async function safeFetch(url: string, options: RequestInit) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      console.error(response.statusText);
      return { success: false as const, error: response.statusText };
    }
    return { success: true as const, response };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: error.message };
  }
}
