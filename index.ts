import { DateTime } from "luxon";
import {
  getToken,
  getLogs,
  getBatteryPercent,
  discordBatteryMessage,
  discordLogsMessage,
  convertToUTC,
} from "./lib";

let globals = {
  lastBatterySOC: -1,
  lastLogDate: DateTime.now().toUTC(),
  batterSOCThresholds: [45, 65, 85, 100]
};

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
      await discordLogsMessage(log.ErrorCode, log.status, log.Time);
    }
  }
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
