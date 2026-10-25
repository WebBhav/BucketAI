import { RawRow } from '../types';

export interface SampleDatasetMeta {
  id: string;
  title: string;
  description: string;
  rowCount: number;
  primaryKeyCol: string;
  remarksCol: string;
  columns: string[];
  getData: () => RawRow[];
}

// Realistic Procurement & Supply Chain Purchase Order Remarks
const PROCUREMENT_REMARKS = [
  'Supplier failed to deliver material on the promised date.',
  'Delivery was delayed due to transportation and logistics issues.',
  'Material received was damaged in transit with broken seals.',
  'Invoice amount does not match the purchase order terms.',
  'Vendor did not respond to the RFQ after three reminders.',
  'Wrong quantity was received against the approved PO.',
  'Shipment arrived 14 days late without prior dispatch notification.',
  'Quality inspection rejected batch due to surface cracks and defects.',
  'Unit price in invoice is higher than contracted purchase order price.',
  'Supplier sales rep unavailable and emails bounced back.',
  'Received 40 units instead of the ordered 100 units.',
  'Pallets were crushed upon arrival at warehouse dock 3.',
  'Delivery truck broke down causing delivery SLA breach.',
  'Mill test certificates were missing from the delivered batch.',
  'Vendor billing department added unauthorized freight charges.',
  'Supplier failed to acknowledge receipt of order amendment.',
  'Part dimensions did not comply with engineering drawing specifications.',
  'Discrepancy of $1,450 between billed invoice and line item total.',
  'Critical delivery delay affecting production assembly line.',
  'Material packaging was soaked and compromised due to rain during loading.',
  'Incorrect part number was delivered in the crate.',
  'Vendor failed to meet agreed lead time of 2 weeks.',
  'Invoice payment terms differ from PO Net 60 agreement.',
  'Repeated supplier phone calls went unanswered during escalation.',
  'Paint finish had severe blistering and did not pass visual QA.',
  'Duplicate billing received for already cleared PO milestone.',
  'Shortage in delivered quantity; remaining items placed on backorder.',
  'Container seal number did not match bill of lading documentation.',
  'Vendor requested price escalation after contract was already signed.',
  'Delayed customs clearance caused a 5-day port demurrage.',
];

const VENDORS = ['Acme Industrial Ltd', 'Apex Global Logistics', 'TechnoForge Corp', 'Zenith Materials', 'NovaTech Supplies', 'Pinnacle Metals'];
const BUYERS = ['Sarah Jenkins', 'David Chen', 'Marcus Vance', 'Elena Rostova', 'Kenji Sato'];

export function generateProcurementDataset(count = 120): RawRow[] {
  const rows: RawRow[] = [];
  for (let i = 0; i < count; i++) {
    // Generate realistic distribution with intentional duplicates and blank remarks
    const isBlank = i % 18 === 0;
    const remarkIndex = isBlank ? -1 : Math.floor((Math.pow(Math.random(), 1.5)) * PROCUREMENT_REMARKS.length) % PROCUREMENT_REMARKS.length;
    const poNum = `PO-${2024000 + (i % 95)}`; // Intentional duplicate PKs for testing

    rows.push({
      __row_index__: i,
      PO_Number: poNum,
      Vendor_Name: VENDORS[i % VENDORS.length],
      Buyer_Name: BUYERS[i % BUYERS.length],
      Order_Date: `2024-0${1 + (i % 6)}-${10 + (i % 18)}`,
      Remarks: isBlank ? '' : PROCUREMENT_REMARKS[remarkIndex],
      Line_Amount_USD: Math.round(1500 + Math.random() * 25000),
    });
  }
  return rows;
}

// IT Service Desk & Support Incidents
const IT_INCIDENTS = [
  'User unable to authenticate via Okta MFA after password reset.',
  'VPN gateway timeout error 806 when connecting remotely.',
  'Laptop screen flickers intermittently and shuts off when moved.',
  'Requested software license assignment for Figma enterprise.',
  'Outlook crashes immediately on launch when opening shared calendar.',
  'Network switch port flapping on 4th floor finance wing.',
  'Cannot connect to corporate Wi-Fi after macOS Sequoia update.',
  'Hard drive SMART error detected; urgent disk cloning required.',
  'Access request for Snowflake data warehouse production read role.',
  'Teams microphone and audio cutting out during all hands call.',
  'Printer queue stalled on HP LaserJet 500 in marketing bullpen.',
  'Blue screen of death with Stop Code CRITICAL_PROCESS_DIED.',
  'Two-factor authentication prompt not receiving push notifications.',
  'Slow internet browsing speeds and packet loss across VPN tunnel.',
  'Keyboard keys sticky and spacebar unresponsive after coffee spill.',
];

export function generateITSupportDataset(count = 100): RawRow[] {
  const rows: RawRow[] = [];
  for (let i = 0; i < count; i++) {
    const isBlank = i % 25 === 0;
    const remarkIndex = isBlank ? -1 : i % IT_INCIDENTS.length;

    rows.push({
      __row_index__: i,
      Ticket_ID: `INC-${89000 + i}`,
      Department: ['Engineering', 'Marketing', 'Finance', 'Sales', 'HR'][i % 5],
      Priority: ['P1 - Urgent', 'P2 - High', 'P3 - Medium', 'P4 - Low'][i % 4],
      Description: isBlank ? '' : IT_INCIDENTS[remarkIndex],
      Reported_Date: `2024-05-${10 + (i % 15)}`,
    });
  }
  return rows;
}

/**
 * Synthetic Large-Scale Benchmark Generator (5,000 to 100,000 rows)
 * Creates realistic Zipfian / power-law distributed remarks
 */
export function generateSyntheticBenchmarkData(rowCount = 5000): {
  rows: RawRow[];
  uniqueRemarkCount: number;
} {
  const baseClusters = [
    {
      theme: 'Shipping & Delivery',
      templates: [
        'Delivery was delayed by {N} days due to freight congestion.',
        'Carrier missed scheduled delivery window at receiving dock.',
        'Shipment rerouted to wrong regional sorting facility.',
        'Courier tracking shows delivered but parcel was not received.',
        'Delayed shipment caused by customs inspection at border.',
      ],
    },
    {
      theme: 'Product Quality & Damage',
      templates: [
        'Item arrived with dented outer casing and scratches.',
        'Internal electronic components failed initial quality inspection test.',
        'Packaging materials torn and moisture penetrated inside box.',
        'Surface finish color does not match approved golden sample.',
        'Broken plastic clips discovered during assembly inspection.',
      ],
    },
    {
      theme: 'Billing & Invoicing',
      templates: [
        'Invoice total does not agree with approved purchase order quotation.',
        'Duplicate invoice submitted for identical line items.',
        'Tax rate calculation in billing statement is incorrect.',
        'Early payment discount not reflected on customer statement.',
        'Billing department added unapproved surcharge of ${N}.',
      ],
    },
    {
      theme: 'Communication & Responsiveness',
      templates: [
        'Account manager has not replied to escalation email after {N} days.',
        'Helpline telephone system disconnects when put on hold.',
        'Support ticket closed prematurely without customer confirmation.',
        'Vendor failed to provide updated production timeline schedule.',
      ],
    },
    {
      theme: 'Inventory & Quantity',
      templates: [
        'Received only {N} units while packing slip indicates complete shipment.',
        'Over-shipment received: {N} additional units delivered without PO authorization.',
        'Inventory stockout for SKU {N} causing fulfillment halt.',
      ],
    },
  ];

  // Generate pool of ~250 unique remarks
  const uniquePool: string[] = [];
  baseClusters.forEach((c) => {
    c.templates.forEach((t) => {
      [3, 5, 10, 14, 25, 100].forEach((n) => {
        uniquePool.push(t.replace('{N}', String(n)));
      });
    });
  });

  const rows: RawRow[] = [];
  const uniqueUsed = new Set<string>();

  for (let i = 0; i < rowCount; i++) {
    // 5% blanks
    const isBlank = i % 20 === 0;
    let remark = '';

    if (!isBlank) {
      // Power-law distribution: frequent phrases appear often, rare phrases appear less often
      const poolIdx = Math.floor(Math.pow(Math.random(), 2.5) * uniquePool.length);
      remark = uniquePool[poolIdx];
      uniqueUsed.add(remark);
    }

    rows.push({
      __row_index__: i,
      Record_ID: `REC-${100000 + i}`,
      Category_Context: `Sector-${(i % 12) + 1}`,
      Timestamp: `2024-06-15T${String((i % 24)).padStart(2, '0')}:00:00Z`,
      Remarks: remark,
    });
  }

  return {
    rows,
    uniqueRemarkCount: uniqueUsed.size,
  };
}

export const SAMPLE_DATASETS: SampleDatasetMeta[] = [
  {
    id: 'procurement',
    title: 'Procurement & Purchase Order Remarks (120 rows)',
    description: 'Realistic supply chain PO remarks featuring delivery delays, damaged materials, invoice mismatches, and vendor non-response.',
    rowCount: 120,
    primaryKeyCol: 'PO_Number',
    remarksCol: 'Remarks',
    columns: ['PO_Number', 'Vendor_Name', 'Buyer_Name', 'Order_Date', 'Remarks', 'Line_Amount_USD'],
    getData: () => generateProcurementDataset(120),
  },
  {
    id: 'it_support',
    title: 'IT Helpdesk Incident Logs (100 rows)',
    description: 'Internal IT ticket remarks with authentication errors, hardware defects, network issues, software crashes, and access requests.',
    rowCount: 100,
    primaryKeyCol: 'Ticket_ID',
    remarksCol: 'Description',
    columns: ['Ticket_ID', 'Department', 'Priority', 'Description', 'Reported_Date'],
    getData: () => generateITSupportDataset(100),
  },
];
