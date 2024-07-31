import getSignKey from "./sign";
import { DateTime } from "luxon";
import { errorCodes } from "./errorCodes";
import type { Logs, Battery } from "./types.d.ts";
import dotenv from "dotenv";
dotenv.config();
const { USERNAME, PASSWORD, GOODSTYPEID, GOODSID, TIMEZONE, DISCORD_WEBHOOK } =
  process.env;

export async function discordMessage(
  errorCode: string,
  status: string,
  time: string,
  extra = ""
) {
  if (!DISCORD_WEBHOOK) {
    console.log("No discord webhook set");
    return;
  }
  let errorMessage = "";
  if (errorCode === "50" && status === "1") {
    // Sinkhole notification
    return;
  }
  switch (errorCode) {
    case "2":
      errorMessage =
        status === "1"
          ? "⚡️✅  Grid power outage ended  ✅⚡️"
          : "⚡️❌  Gird power outage started - Everything is on UPS now  ❌⚡️";
      break;
    case "50":
      errorMessage =
        status === "1"
          ? "🔋  Battery Charging Started  🔋"
          : "🪫  Low battery - Everything is on grid now  🪫";
      break;

    case "50.1":
      errorMessage = `🪫  Battery dropped below 85%  🪫`;
      break;
    case "50.2":
      errorMessage = `🪫  Battery dropped below 65%  🪫`;
      break;
    case "50.3":
      errorMessage = `🔋  Battery reached back to 65%  🔋`;
      break;
    case "50.4":
      errorMessage = `🔋  Battery reached back to 85%  🔋`;
      break;
    case "50.5":
      errorMessage = `🔋  Battery reached back to 100%  🔋`;
      break;
    case "50.6":
      errorMessage = `🪫  Battery dropped below 100%  🪫`;
      break;

    default:
      errorMessage =
        status === "1"
          ? `${errorCodes[errorCode]} inactive`
          : `${errorCodes[errorCode]} active`;
      break;
  }

  const body = {
    embeds: [
      {
        author: {
          name: "SolarMax",
        },
        title: errorMessage,
        description: extra,
        color: status === "1" ? 5763719 : 15548997,
        timestamp: time,
      },
    ],
  };

  await safeFetch(DISCORD_WEBHOOK, {
    body: JSON.stringify(body),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
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
