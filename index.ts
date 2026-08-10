import { DateTime } from "luxon";
import {
  getToken,
  getLogs,
  getBatteryPercent,
  getHealthCheck,
  discordBatteryMessage,
  discordLogsMessage,
  convertToUTC,
  discordHealthCheckMessage,
} from "./lib";
import dotenv from "dotenv";
dotenv.config();
const { TIMEZONE } = process.env;

let globals = {
  lastBatterySOC: -1,
  lastLogDate: DateTime.now().toUTC(),
  batterSOCThresholds: [45, 65, 85, 95],
  lastHealthCheckStatus: true,
};

async function main() {
  const token = await getToken();
  while (true) {
    await execHealthCheck(token);
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
  const logsReversed = logs.infoerror.toReversed();
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
      await discordLogsMessage(log.ErrorCode, log.status, log.Time);
      // Wait for 3 seconds before sending another message.
      // The messages currently are sent out of order.
      // This might fix it.
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
  const lastLogDate = convertToUTC(logs.infoerror[0].Time);
  globals.lastLogDate = lastLogDate ?? DateTime.now().toUTC();
}

async function execBattery(token: string) {
  const { SOC } = await getBatteryPercent(token);
  const currentSOC = Number(SOC);
  //console.log(globals.lastBatterySOC, currentSOC);
  if (currentSOC === -1 || globals.lastBatterySOC === currentSOC) {
    return;
  }
  if (globals.lastBatterySOC === -1) {
    globals.lastBatterySOC = currentSOC;
    return;
  }

  if (currentSOC > globals.lastBatterySOC) {
    for (const threshold of globals.batterSOCThresholds) {
      if (currentSOC >= threshold && globals.lastBatterySOC < threshold) {
        await discordBatteryMessage(currentSOC, threshold, "1");
      }
    }
  }
  else {
    const reversedThresholds = [...globals.batterSOCThresholds].reverse();
    for (const threshold of reversedThresholds) {
      if (currentSOC < threshold && globals.lastBatterySOC >= threshold) {
        await discordBatteryMessage(currentSOC, threshold, "0");
      }
    }
  }
  globals.lastBatterySOC = currentSOC;
}

async function execHealthCheck(token: string) {
  const healthCheckData = await getHealthCheck(token);
  const isFailedCheck = healthCheckData["AllGroupList"].length === 0
  if (isFailedCheck) {
    return;
  }
  const lastUpdated = DateTime.fromFormat(
    // TODO: This is hardcoded to select first solar in the group. Make it more dynamic?
    healthCheckData["AllGroupList"][0].LastUpdate,
    "yyyy-MM-dd HH:mm:ss",
    { zone: TIMEZONE }
  );
  const minutesSinceUpdate = DateTime.now().diff(lastUpdated, "minutes").minutes;
  const currentHealthCheckStatus = minutesSinceUpdate < 10;
  if (currentHealthCheckStatus === globals.lastHealthCheckStatus) {
    return;
  }
  globals.lastHealthCheckStatus = currentHealthCheckStatus;
  await discordHealthCheckMessage(currentHealthCheckStatus ? "🟢 Solar Wifi Connected" : "🔴 Solar Wifi Disconnected");
}