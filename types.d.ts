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
