export type Logs = {
  total_error_num: number;
  infoerror?: Infoerror[];
};

export type Infoerror = {
  ModelName: string;
  GoodsName: string;
  MemberID: string;
  GoodsID: string;
  Time: string;
  ErrorCode: string;
  status: string;
};

export type Battery = {
  type: string;
  TotalDCpower: number;
  Mode: string;
  Pbat: string;
  Pbat2: string;
  SOC: string;
  SOC2: string;
  connectType: string;
  epsCurrpac: string;
  gridCurrpac: string;
  loadCurrpac: string;
  genCurrpac: string;
  coupleCurrpac: string;
  hybridWorkMode: string;
  display: string;
};


export type HealthCheck = {
  "AllGroupList": 
      {
          "InverterStatus": {
              "Green": number,
              "yellow": number,
              "red": number,
              "gray": number
          },
          "AutoID": string,
          "GoodsTypeName": string,
          "GreenPercent": number,
          "Light": number,
          "CurrPac": number,
          "EToday": number,
          "Htotal": number,
          "Price": string,
          "GoodsKWP": number,
          "effect": number,
          "CreateDate": string,
          "SetUpTime": string,
          "LastUpdate": string,
          "view": true,
          "Inv": number,
          "GoodsTypePicName": null,
          "checkPlantType": string,
          "ETotal": number,
          "Unit": string
      } []
}