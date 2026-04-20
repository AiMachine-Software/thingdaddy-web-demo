// DEMO DATA: These prefixes are illustrative examples for the ThingDaddy demo.
// Real GS1 Company Prefixes should be verified via https://www.gs1.org/services/check-company-database

export interface CompanyPrefix {
  prefix: string
  name: string
  nameLocal?: string
  country: string
  industry?: string
}

export const COMPANY_PREFIX_DIRECTORY: CompanyPrefix[] = [
  // ===== GS1 US (prefix 001-019, 030-039, 060-139) =====
  { prefix: '0614141', name: 'GS1 US (test prefix)', country: 'US', industry: 'standards' },
  { prefix: '0078742', name: 'Walmart', country: 'US', industry: 'retail' },
  { prefix: '0012345', name: 'General Mills', country: 'US', industry: 'fmcg' },
  { prefix: '0037000', name: 'Procter & Gamble', country: 'US', industry: 'fmcg' },
  { prefix: '0038000', name: 'Kellogg Company', country: 'US', industry: 'fmcg' },
  { prefix: '0040000', name: 'Kraft Heinz', country: 'US', industry: 'fmcg' },
  { prefix: '0041333', name: 'Duracell', country: 'US', industry: 'electronics' },
  { prefix: '0049000', name: 'The Coca-Cola Company', country: 'US', industry: 'fmcg' },
  { prefix: '0060383', name: '3M Company', country: 'US', industry: 'industrial' },
  { prefix: '0071691', name: 'SC Johnson', country: 'US', industry: 'fmcg' },
  { prefix: '0080432', name: 'Johnson & Johnson', country: 'US', industry: 'pharma' },
  { prefix: '0088076', name: 'Hershey', country: 'US', industry: 'fmcg' },
  { prefix: '0012546', name: 'Colgate-Palmolive', country: 'US', industry: 'fmcg' },
  { prefix: '0011110', name: 'Kroger', country: 'US', industry: 'retail' },
  { prefix: '0013800', name: 'PepsiCo', country: 'US', industry: 'fmcg' },
  { prefix: '0022000', name: 'Nestlé USA', country: 'US', industry: 'fmcg' },
  { prefix: '0079400', name: 'Church & Dwight', country: 'US', industry: 'fmcg' },
  { prefix: '0028400', name: 'Frito-Lay', country: 'US', industry: 'fmcg' },

  // ===== GS1 Thailand (prefix 885) =====
  { prefix: '8850001', name: 'Thai President Foods', nameLocal: 'ไทยเพรซิเดนท์ฟูดส์', country: 'TH', industry: 'fmcg' },
  { prefix: '8850002', name: 'CP Group (Charoen Pokphand)', nameLocal: 'เจริญโภคภัณฑ์', country: 'TH', industry: 'fmcg' },
  { prefix: '8850006', name: 'Siam Cement Group', nameLocal: 'ปูนซิเมนต์ไทย', country: 'TH', industry: 'industrial' },
  { prefix: '8850007', name: 'PTT Public Company', nameLocal: 'ปตท.', country: 'TH', industry: 'energy' },
  { prefix: '8850010', name: 'Boonrawd Brewery (Singha)', nameLocal: 'บุญรอดบริวเวอรี่', country: 'TH', industry: 'fmcg' },
  { prefix: '8850012', name: 'Thai Beverage (ThaiBev)', nameLocal: 'ไทยเบฟเวอเรจ', country: 'TH', industry: 'fmcg' },
  { prefix: '8850017', name: 'Osotspa', nameLocal: 'โอสถสภา', country: 'TH', industry: 'fmcg' },
  { prefix: '8850051', name: 'Minor International', nameLocal: 'ไมเนอร์อินเตอร์เนชั่นแนล', country: 'TH', industry: 'hospitality' },
  { prefix: '8850100', name: 'Double A', nameLocal: 'ดั๊บเบิ้ล เอ', country: 'TH', industry: 'industrial' },
  { prefix: '8851028', name: 'Thai Union Group', nameLocal: 'ไทยยูเนี่ยน กรุ๊ป', country: 'TH', industry: 'fmcg' },
  { prefix: '8851123', name: 'Indorama Ventures', nameLocal: 'อินโดรามา เวนเจอร์ส', country: 'TH', industry: 'industrial' },
  { prefix: '8850329', name: 'Central Group', nameLocal: 'เซ็นทรัลกรุ๊ป', country: 'TH', industry: 'retail' },
  { prefix: '8858718', name: 'ThingDaddy (Demo)', nameLocal: 'ธิงแดดดี้', country: 'TH', industry: 'technology' },

  // ===== GS1 Japan (prefix 450-459, 490-499) =====
  { prefix: '4901777', name: 'Toyota Motor', country: 'JP', industry: 'automotive' },
  { prefix: '4902370', name: 'Nintendo', country: 'JP', industry: 'electronics' },
  { prefix: '4902520', name: 'Sony Group', country: 'JP', industry: 'electronics' },
  { prefix: '4901780', name: 'Honda Motor', country: 'JP', industry: 'automotive' },
  { prefix: '4902778', name: 'Panasonic', country: 'JP', industry: 'electronics' },
  { prefix: '4902580', name: 'Sharp Corporation', country: 'JP', industry: 'electronics' },
  { prefix: '4901681', name: 'Ajinomoto', country: 'JP', industry: 'fmcg' },
  { prefix: '4903320', name: 'Canon Inc.', country: 'JP', industry: 'electronics' },
  { prefix: '4904810', name: 'Nikon Corporation', country: 'JP', industry: 'electronics' },
  { prefix: '4902430', name: 'Fujifilm', country: 'JP', industry: 'electronics' },

  // ===== GS1 UK (prefix 500-509) =====
  { prefix: '5000159', name: 'Unilever UK', country: 'GB', industry: 'fmcg' },
  { prefix: '5000127', name: 'Cadbury (Mondelēz)', country: 'GB', industry: 'fmcg' },
  { prefix: '5010029', name: 'Diageo', country: 'GB', industry: 'fmcg' },
  { prefix: '5000112', name: 'GlaxoSmithKline', country: 'GB', industry: 'pharma' },
  { prefix: '5000295', name: 'AstraZeneca', country: 'GB', industry: 'pharma' },
  { prefix: '5000328', name: 'Reckitt Benckiser', country: 'GB', industry: 'fmcg' },
  { prefix: '5010204', name: 'Tesco Stores', country: 'GB', industry: 'retail' },
  { prefix: '5012345', name: 'Rolls-Royce', country: 'GB', industry: 'industrial' },

  // ===== GS1 Germany (prefix 400-440) =====
  { prefix: '4000521', name: 'Siemens AG', country: 'DE', industry: 'industrial' },
  { prefix: '4001475', name: 'Robert Bosch GmbH', country: 'DE', industry: 'automotive' },
  { prefix: '4002515', name: 'BASF SE', country: 'DE', industry: 'chemical' },
  { prefix: '4005808', name: 'Henkel AG', country: 'DE', industry: 'fmcg' },
  { prefix: '4000862', name: 'Volkswagen AG', country: 'DE', industry: 'automotive' },
  { prefix: '4005900', name: 'BMW Group', country: 'DE', industry: 'automotive' },
  { prefix: '4060800', name: 'SAP SE', country: 'DE', industry: 'technology' },

  // ===== GS1 France (prefix 300-379) =====
  { prefix: '3011780', name: "L'Oréal", country: 'FR', industry: 'fmcg' },
  { prefix: '3228857', name: 'Danone', country: 'FR', industry: 'fmcg' },
  { prefix: '3017620', name: 'Michelin', country: 'FR', industry: 'automotive' },
  { prefix: '3596710', name: 'Airbus Group', country: 'FR', industry: 'aerospace' },
  { prefix: '3245678', name: 'Schneider Electric', country: 'FR', industry: 'industrial' },

  // ===== GS1 South Korea (prefix 880) =====
  { prefix: '8801056', name: 'Samsung Electronics', country: 'KR', industry: 'electronics' },
  { prefix: '8801073', name: 'LG Electronics', country: 'KR', industry: 'electronics' },
  { prefix: '8801043', name: 'Hyundai Motor', country: 'KR', industry: 'automotive' },
  { prefix: '8801062', name: 'SK Hynix', country: 'KR', industry: 'electronics' },
  { prefix: '8801115', name: 'Kia Corporation', country: 'KR', industry: 'automotive' },

  // ===== GS1 China (prefix 690-699) =====
  { prefix: '6901028', name: 'Huawei Technologies', country: 'CN', industry: 'electronics' },
  { prefix: '6902265', name: 'Lenovo Group', country: 'CN', industry: 'electronics' },
  { prefix: '6921168', name: 'Xiaomi Corporation', country: 'CN', industry: 'electronics' },
  { prefix: '6901668', name: 'Haier Group', country: 'CN', industry: 'electronics' },
  { prefix: '6907992', name: 'BYD Company', country: 'CN', industry: 'automotive' },
  { prefix: '6922927', name: 'Milesight IoT', nameLocal: '星纵智联', country: 'CN', industry: 'iot' },

  // ===== GS1 Australia (prefix 930-939) =====
  { prefix: '9300601', name: 'Woolworths Group', country: 'AU', industry: 'retail' },
  { prefix: '9310055', name: 'BHP Group', country: 'AU', industry: 'mining' },
  { prefix: '9300633', name: 'Coles Group', country: 'AU', industry: 'retail' },

  // ===== GS1 India (prefix 890) =====
  { prefix: '8901030', name: 'Tata Group', country: 'IN', industry: 'conglomerate' },
  { prefix: '8901063', name: 'Reliance Industries', country: 'IN', industry: 'conglomerate' },
  { prefix: '8901764', name: 'Wipro Limited', country: 'IN', industry: 'technology' },
  { prefix: '8901526', name: 'Infosys Limited', country: 'IN', industry: 'technology' },

  // ===== GS1 Brazil (prefix 789-790) =====
  { prefix: '7891000', name: 'Ambev (AB InBev Brazil)', country: 'BR', industry: 'fmcg' },
  { prefix: '7891038', name: 'Natura &Co', country: 'BR', industry: 'fmcg' },
  { prefix: '7891910', name: 'Petrobras', country: 'BR', industry: 'energy' },

  // ===== GS1 Switzerland (prefix 760-769) =====
  { prefix: '7611400', name: 'Nestlé SA', country: 'CH', industry: 'fmcg' },
  { prefix: '7610200', name: 'Novartis AG', country: 'CH', industry: 'pharma' },
  { prefix: '7612100', name: 'Roche Holding', country: 'CH', industry: 'pharma' },
  { prefix: '7610400', name: 'ABB Ltd', country: 'CH', industry: 'industrial' },

  // ===== GS1 Italy (prefix 800-839) =====
  { prefix: '8001120', name: 'Ferrari N.V.', country: 'IT', industry: 'automotive' },
  { prefix: '8001050', name: 'Barilla Group', country: 'IT', industry: 'fmcg' },
  { prefix: '8002590', name: 'Luxottica (EssilorLuxottica)', country: 'IT', industry: 'fmcg' },

  // ===== GS1 Spain (prefix 840-849) =====
  { prefix: '8410000', name: 'Inditex (Zara)', country: 'ES', industry: 'retail' },
  { prefix: '8410128', name: 'Mercadona', country: 'ES', industry: 'retail' },

  // ===== GS1 Netherlands (prefix 870-879) =====
  { prefix: '8710398', name: 'Philips', country: 'NL', industry: 'electronics' },
  { prefix: '8711200', name: 'Unilever NV', country: 'NL', industry: 'fmcg' },
  { prefix: '8718291', name: 'ASML Holding', country: 'NL', industry: 'electronics' },

  // ===== GS1 Sweden (prefix 730-739) =====
  { prefix: '7310390', name: 'IKEA (Inter IKEA)', country: 'SE', industry: 'retail' },
  { prefix: '7311570', name: 'Volvo Group', country: 'SE', industry: 'automotive' },
  { prefix: '7310400', name: 'H&M Group', country: 'SE', industry: 'retail' },
  { prefix: '7312456', name: 'Ericsson', country: 'SE', industry: 'electronics' },

  // ===== GS1 Taiwan (prefix 471) =====
  { prefix: '4710088', name: 'TSMC', country: 'TW', industry: 'electronics' },
  { prefix: '4710736', name: 'Foxconn (Hon Hai)', country: 'TW', industry: 'electronics' },
  { prefix: '4711162', name: 'Acer Inc.', country: 'TW', industry: 'electronics' },
  { prefix: '4718014', name: 'ASUS', country: 'TW', industry: 'electronics' },

  // ===== Fictional/Demo =====
  { prefix: '0000001', name: 'Acme Corporation (Demo)', country: 'US', industry: 'demo' },
  { prefix: '9999999', name: 'Stark Industries (Demo)', country: 'US', industry: 'demo' },
  { prefix: '1234567', name: 'Wayne Enterprises (Demo)', country: 'US', industry: 'demo' },
]
