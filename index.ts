import { DateTime } from "luxon";
import {
  getToken,
  getLogs,
  getBatteryPercent,
  discordMessage,
  convertToUTC,
} from "./lib";

let globals = {
  lastBatterySOC: 0,
  lastLogDate: DateTime.now().toUTC(),
}

async function main() {
  const token = await getToken();
  while (true) {
    await execLogs(token);
    await execBattery(token);
    await new Promise((resolve) => setTimeout(resolve, 1000 * 60));
  }
}

main();

async function execLogs(token: string) {
  const logs = await getLogs(token);
  if (!logs.infoerror) {
    return;
  }
  const logsReversed = logs.infoerror.reverse();
  for (const log of logsReversed) {
    const logDate = convertToUTC(log.Time);
    if (!logDate) {
      continue;
    }
    if (logDate > globals.lastLogDate) {
      // console.log(
      //   errorCodes[log.ErrorCode],
      //   log.status === "1" ? "Inactive" : "Active",
      //   logDate
      // );
      globals.lastLogDate = logDate;
      await discordMessage(log.ErrorCode, log.status, logDate.toISO());
    }
  }
}

async function execBattery(token: string) {
  const { SOC } = await getBatteryPercent(token);
  const numberSOC = Number(SOC);
  //console.log(globals.lastBatterySOC, numberSOC);
  if (globals.lastBatterySOC === -1 || globals.lastBatterySOC === numberSOC) {
    return;
  }
  if (globals.lastBatterySOC < 100 && numberSOC >= 100) {
    await discordMessage(
      "50.5",
      "1",
      DateTime.now().toISO(),
      `Battery SOC: ${numberSOC}%`
    );
    // Charged back to 100%
  }
  if (globals.lastBatterySOC === 100 && numberSOC < 100) {
    await discordMessage(
      "50.6",
      "0",
      DateTime.now().toISO(),
      `Battery SOC: ${numberSOC}%`
    );
    // Charging dropped below 100%
  }
  if (globals.lastBatterySOC < 85 && numberSOC >= 85) {
    await discordMessage(
      "50.4",
      "1",
      DateTime.now().toISO(),
      `Battery SOC: ${numberSOC}%`
    );
    // Charged back to 85%
  }
  if (globals.lastBatterySOC > 85 && numberSOC <= 85) {
    await discordMessage(
      "50.1",
      "0",
      DateTime.now().toISO(),
      `Battery SOC: ${numberSOC}%`
    );
    // Charging dropped below 85%
  }
  if (globals.lastBatterySOC < 65 && numberSOC >= 65) {
    await discordMessage(
      "50.3",
      "1",
      DateTime.now().toISO(),
      `Battery SOC: ${numberSOC}%`
    );
    // Charged back to 65%
  }
  if (globals.lastBatterySOC > 65 && numberSOC <= 65) {
    await discordMessage(
      "50.2",
      "0",
      DateTime.now().toISO(),
      `Battery SOC: ${numberSOC}%`
    );
    // Charging dropped below 65%
  }
  globals.lastBatterySOC = numberSOC;
}
