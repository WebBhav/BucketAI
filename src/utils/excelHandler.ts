import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import {
  RawRow,
  ColumnSuggestion,
  Bucket,
  RowAssignment,
  ColumnMeta,
  WorkbookPreservationMeta,
} from '../types';
import { getExcelColumnLetter } from './filterEngine';

const PK_CANDIDATE_REGEX = /^(id|pk|key|code|po|po_num|po_number|ticket|order_id|ref|reference|case_id|tracking_id|item_id|invoice_no|inv_num)$/i;
const REMARK_CANDIDATE_REGEX = /(remark|comment|justification|reason|description|observation|note|feedback|explanation|issue|narrative)/i;

export interface ParsedWorkbookData {
  sheetNames: string[];
  activeSheet: string;
  rows: RawRow[];
  columns: string[];
  columnMetas: ColumnMeta[];
  suggestion: ColumnSuggestion;
  totalRowCount: number;
  preservationMeta: WorkbookPreservationMeta;
  workbookObj?: XLSX.WorkBook;
}

/**
 * Sanitizes cell values to prevent CSV / Excel Formula Injection (DDE attacks)
 */
export function sanitizeCellValue(val: any): any {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return val;
}

/**
 * Detects column metadata (letters, types, sample values)
 */
export function buildColumnMetas(columns: string[], rows: RawRow[]): ColumnMeta[] {
  return columns.map((colName, idx) => {
    const letter = getExcelColumnLetter(idx);
    const sampleValues: any[] = [];
    let numberCount = 0;
    let booleanCount = 0;
    let validCount = 0;

    for (let r = 0; r < Math.min(rows.length, 50); r++) {
      const val = rows[r][colName];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        validCount++;
        if (sampleValues.length < 5) sampleValues.push(val);
        if (typeof val === 'number' || (!isNaN(Number(val)) && !isNaN(parseFloat(val)))) {
          numberCount++;
        }
        if (typeof val === 'boolean' || String(val).toLowerCase() === 'true' || String(val).toLowerCase() === 'false') {
          booleanCount++;
        }
      }
    }

    let inferredType: 'string' | 'number' | 'boolean' | 'date' | 'empty' = 'string';
    if (validCount === 0) inferredType = 'empty';
    else if (numberCount >= validCount * 0.8) inferredType = 'number';
    else if (booleanCount >= validCount * 0.8) inferredType = 'boolean';

    return {
      name: colName,
      letter,
      index: idx,
      inferredType,
      sampleValues,
    };
  });
}

/**
 * Suggests best primary key, remarks, and context columns
 */
export function detectColumns(columns: string[]): ColumnSuggestion {
  let primaryKeyCol = '';
  let remarksCol = '';
  const contextCols: string[] = [];

  for (const col of columns) {
    if (REMARK_CANDIDATE_REGEX.test(col)) {
      remarksCol = col;
      break;
    }
  }

  for (const col of columns) {
    if (col !== remarksCol && PK_CANDIDATE_REGEX.test(col)) {
      primaryKeyCol = col;
      break;
    }
  }

  if (!primaryKeyCol && columns.length > 0) {
    primaryKeyCol = columns[0];
  }
  if (!remarksCol && columns.length > 1) {
    remarksCol = columns[1] === primaryKeyCol && columns.length > 2 ? columns[2] : columns[1];
  } else if (!remarksCol && columns.length === 1) {
    remarksCol = columns[0];
  }

  columns.forEach((col) => {
    if (col !== primaryKeyCol && col !== remarksCol) {
      contextCols.push(col);
    }
  });

  return {
    primaryKeyCol,
    remarksCol,
    contextCols,
    allColumns: columns,
  };
}

/**
 * Detects presence of charts, drawings, and pivot tables in XLSX binary zip
 */
export async function inspectWorkbookFeatures(arrayBuffer: ArrayBuffer): Promise<{
  hasCharts: boolean;
  features: string[];
}> {
  try {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const files = Object.keys(zip.files);

    const hasCharts = files.some((f) => f.includes('xl/charts/') || f.includes('chart'));
    const hasDrawings = files.some((f) => f.includes('xl/drawings/'));
    const hasPivots = files.some((f) => f.includes('pivotTable'));
    const hasMacros = files.some((f) => f.endsWith('.bin') || f.includes('vbaProject'));

    const features: string[] = [];
    if (hasCharts) features.push('Embedded Charts');
    if (hasDrawings) features.push('Shapes & Drawings');
    if (hasPivots) features.push('Pivot Tables');
    if (hasMacros) features.push('VBA Macros');

    return { hasCharts, features };
  } catch (err) {
    return { hasCharts: false, features: [] };
  }
}

/**
 * Extracts data for a specified worksheet from a loaded workbook
 */
export function extractSheetData(
  workbook: XLSX.WorkBook,
  sheetName: string,
  preservationMeta?: WorkbookPreservationMeta
): ParsedWorkbookData {
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error(`Worksheet "${sheetName}" not found in workbook.`);
  }

  const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  if (rawJson.length === 0) {
    throw new Error(`The worksheet "${sheetName}" is empty.`);
  }

  const headerRow: any[] = rawJson[0] || [];
  const columns: string[] = headerRow.map((col, idx) => {
    const name = String(col || '').trim();
    return name || `Column_${idx + 1}`;
  });

  const rows: RawRow[] = [];
  for (let i = 1; i < rawJson.length; i++) {
    const rowArray = rawJson[i];
    const rowObj: RawRow = { __row_index__: i - 1 };
    let hasAnyData = false;

    columns.forEach((colName, colIdx) => {
      const val = rowArray[colIdx] !== undefined ? rowArray[colIdx] : '';
      rowObj[colName] = val;
      if (val !== '' && val !== null && val !== undefined) {
        hasAnyData = true;
      }
    });

    if (hasAnyData) {
      rows.push(rowObj);
    }
  }

  const suggestion = detectColumns(columns);
  const columnMetas = buildColumnMetas(columns, rows);

  return {
    sheetNames: workbook.SheetNames,
    activeSheet: sheetName,
    rows,
    columns,
    columnMetas,
    suggestion,
    totalRowCount: rows.length,
    workbookObj: workbook,
    preservationMeta: preservationMeta || {
      hasCharts: false,
      sheetCount: workbook.SheetNames.length,
      originalSheets: workbook.SheetNames,
      detectedFeatures: [],
    },
  };
}

/**
 * Reads file into parsed workbook data with preservation metadata
 */
export async function parseExcelOrCsv(file: File): Promise<ParsedWorkbookData> {
  const buffer = await file.arrayBuffer();
  const isXlsx = file.name.endsWith('.xlsx') || file.name.endsWith('.xlsm');

  let featureCheck = { hasCharts: false, features: [] as string[] };
  if (isXlsx) {
    featureCheck = await inspectWorkbookFeatures(buffer);
  }

  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: true,
    cellText: false,
    raw: true,
  });

  const sheetNames = workbook.SheetNames;
  if (sheetNames.length === 0) {
    throw new Error('The uploaded file does not contain any readable worksheets.');
  }

  const preservationMeta: WorkbookPreservationMeta = {
    originalFileBuffer: buffer,
    originalFileName: file.name,
    hasCharts: featureCheck.hasCharts,
    sheetCount: sheetNames.length,
    originalSheets: sheetNames,
    detectedFeatures: featureCheck.features,
  };

  const activeSheet = sheetNames[0];
  return extractSheetData(workbook, activeSheet, preservationMeta);
}

/**
 * Creates OpenXML Chart XML (Bar or Pie) for embedding in Excel .xlsx
 */
function generateOpenXmlChart(
  categories: string[],
  values: number[],
  summarySheetName: string,
  chartType: 'bar' | 'pie' = 'bar'
): string {
  const count = categories.length;
  const numCats = categories
    .map((c, i) => `<c:pt idx="${i}"><c:v>${escapeXml(c)}</c:v></c:pt>`)
    .join('');
  const numVals = values
    .map((v, i) => `<c:pt idx="${i}"><c:v>${v}</c:v></c:pt>`)
    .join('');

  // Palette colors for pie chart segments
  const pieColors = [
    'E11D48', 'F43F5E', 'BE123C', '9F1239', '881337',
    '3F3F46', '52525B', '71717A', 'A1A1AA', 'D4D4D8'
  ];

  const pieDataPoints = categories
    .map((_, i) => `
      <c:dPt>
        <c:idx val="${i}"/>
        <c:spPr>
          <a:solidFill><a:srgbClr val="${pieColors[i % pieColors.length]}"/></a:solidFill>
        </c:spPr>
      </c:dPt>
    `)
    .join('');

  const chartBody = chartType === 'pie'
    ? `
      <c:pieChart>
        <c:varyColors val="1"/>
        <c:ser>
          <c:idx val="0"/>
          <c:order val="0"/>
          <c:tx>
            <c:strRef>
              <c:f>&apos;${escapeXml(summarySheetName)}&apos;!$C$14</c:f>
              <c:strCache>
                <c:ptCount val="1"/>
                <c:pt idx="0"><c:v>Total Rows</c:v></c:pt>
              </c:strCache>
            </c:strRef>
          </c:tx>
          ${pieDataPoints}
          <c:cat>
            <c:strRef>
              <c:f>&apos;${escapeXml(summarySheetName)}&apos;!$B$15:$B$${14 + count}</c:f>
              <c:strCache>
                <c:ptCount val="${count}"/>
                ${numCats}
              </c:strCache>
            </c:strRef>
          </c:cat>
          <c:val>
            <c:numRef>
              <c:f>&apos;${escapeXml(summarySheetName)}&apos;!$C$15:$C$${14 + count}</c:f>
              <c:numCache>
                <c:formatCode>#,##0</c:formatCode>
                <c:ptCount val="${count}"/>
                ${numVals}
              </c:numCache>
            </c:numRef>
          </c:val>
        </c:ser>
        <c:firstSliceAng val="0"/>
      </c:pieChart>
    `
    : `
      <c:barChart>
        <c:barDir val="col"/>
        <c:grouping val="clustered"/>
        <c:ser>
          <c:idx val="0"/>
          <c:order val="0"/>
          <c:tx>
            <c:strRef>
              <c:f>&apos;${escapeXml(summarySheetName)}&apos;!$C$14</c:f>
              <c:strCache>
                <c:ptCount val="1"/>
                <c:pt idx="0"><c:v>Total Rows</c:v></c:pt>
              </c:strCache>
            </c:strRef>
          </c:tx>
          <c:spPr>
            <a:solidFill><a:srgbClr val="E11D48"/></a:solidFill>
          </c:spPr>
          <c:cat>
            <c:strRef>
              <c:f>&apos;${escapeXml(summarySheetName)}&apos;!$B$15:$B$${14 + count}</c:f>
              <c:strCache>
                <c:ptCount val="${count}"/>
                ${numCats}
              </c:strCache>
            </c:strRef>
          </c:cat>
          <c:val>
            <c:numRef>
              <c:f>&apos;${escapeXml(summarySheetName)}&apos;!$C$15:$C$${14 + count}</c:f>
              <c:numCache>
                <c:formatCode>#,##0</c:formatCode>
                <c:ptCount val="${count}"/>
                ${numVals}
              </c:numCache>
            </c:numRef>
          </c:val>
        </c:ser>
        <c:axId val="14251234"/>
        <c:axId val="14251235"/>
      </c:barChart>
      <c:catAx>
        <c:axId val="14251234"/>
        <c:scaling><c:orientation val="minMax"/></c:scaling>
        <c:delete val="0"/>
        <c:axPos val="b"/>
        <c:majorTickMark val="none"/>
        <c:minorTickMark val="none"/>
        <c:tickLblPos val="nextTo"/>
        <c:crossAx val="14251235"/>
        <c:crosses val="autoZero"/>
        <c:auto val="1"/>
        <c:lblAlgn val="ctr"/>
        <c:lblOffset val="100"/>
      </c:catAx>
      <c:valAx>
        <c:axId val="14251235"/>
        <c:scaling><c:orientation val="minMax"/></c:scaling>
        <c:delete val="0"/>
        <c:axPos val="l"/>
        <c:majorGridlines/>
        <c:majorTickMark val="none"/>
        <c:minorTickMark val="none"/>
        <c:tickLblPos val="nextTo"/>
        <c:crossAx val="14251234"/>
        <c:crosses val="autoZero"/>
        <c:crossBetween val="between"/>
      </c:valAx>
    `;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <c:chart>
    <c:title>
      <c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1400" b="1"/></a:pPr><a:r><a:rPr/><a:t>BucketAI — Remark Distribution</a:t></a:r></a:p></c:rich></c:tx>
      <c:layout/>
      <c:overlay val="0"/>
    </c:title>
    <c:plotArea>
      <c:layout/>
      ${chartBody}
    </c:plotArea>
    <c:legend>
      <c:legendPos val="r"/>
      <c:layout/>
      <c:overlay val="0"/>
    </c:legend>
    <c:plotVisOnly val="1"/>
  </c:chart>
</c:chartSpace>`;
}

/**
 * Creates OpenXML Drawing XML anchoring the chart cleanly next to the summary tables
 * (Anchors from Column H, Row 3 to Column Q, Row 22)
 */
function generateOpenXmlDrawing(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <xdr:twoCellAnchor>
    <xdr:from><xdr:col>7</xdr:col><xdr:colOffset>100000</xdr:colOffset><xdr:row>2</xdr:row><xdr:rowOffset>50000</xdr:rowOffset></xdr:from>
    <xdr:to><xdr:col>16</xdr:col><xdr:colOffset>200000</xdr:colOffset><xdr:row>22</xdr:row><xdr:rowOffset>100000</xdr:rowOffset></xdr:to>
    <xdr:graphicFrame macro="">
      <xdr:nvGraphicFramePr>
        <xdr:cNvPr id="2" name="BucketAI Chart 1"/>
        <xdr:cNvGraphicFramePr/>
      </xdr:nvGraphicFramePr>
      <xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm>
      <a:graphic>
        <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart">
          <c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rId1"/>
        </a:graphicData>
      </a:graphic>
    </xdr:graphicFrame>
    <xdr:clientData/>
  </xdr:twoCellAnchor>
</xdr:wsDr>`;
}

/**
 * Generates OpenXML worksheet XML for the dedicated BucketAI Summary sheet
 */
function generateOpenXmlSummarySheet(
  summarySheetName: string,
  fileName: string,
  selectedSheetName: string,
  buckets: Bucket[],
  totalRows: number,
  includedRows: number,
  excludedRows: number,
  needsReviewRows: number
): string {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  const blankBucket = buckets.find((b) => b.isBlankBucket || b.id === 'bucket_blank');
  const blankRows = blankBucket ? blankBucket.totalRows : 0;
  const discoveredCategoriesCount = buckets.filter((b) => !b.isBlankBucket).length;

  // Build rows for category breakdown table (starts at row 15)
  const categoryRowsXml = buckets
    .map((b, idx) => {
      const rowNum = 15 + idx;
      const pct = includedRows > 0 ? ((b.totalRows / includedRows) * 100).toFixed(1) + '%' : '0%';
      const catType = b.isBlankBucket || b.id === 'bucket_blank'
        ? 'Blank / No Remarks'
        : b.isOutlierBucket
        ? 'Outlier / Borderline'
        : 'Discovered Category';

      return `<row r="${rowNum}">
        <c r="A${rowNum}" t="inlineStr"><is><t>${escapeXml(b.id)}</t></is></c>
        <c r="B${rowNum}" t="inlineStr"><is><t>${escapeXml(b.name)}</t></is></c>
        <c r="C${rowNum}"><v>${b.totalRows}</v></c>
        <c r="D${rowNum}" t="inlineStr"><is><t>${escapeXml(pct)}</t></is></c>
        <c r="E${rowNum}" t="inlineStr"><is><t>${escapeXml(catType)}</t></is></c>
        <c r="F${rowNum}" t="inlineStr"><is><t>${escapeXml(b.description || '')}</t></is></c>
      </row>`;
    })
    .join('\n');

  const maxRow = 15 + buckets.length;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <dimension ref="A1:F${maxRow}"/>
  <sheetViews>
    <sheetView tabSelected="1" workbookViewId="0">
      <pane ySplit="14" topLeftCell="A15" activePane="bottomLeft" state="frozen"/>
    </sheetView>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="15"/>
  <cols>
    <col min="1" max="1" width="16" customWidth="1"/>
    <col min="2" max="2" width="30" customWidth="1"/>
    <col min="3" max="3" width="14" customWidth="1"/>
    <col min="4" max="4" width="16" customWidth="1"/>
    <col min="5" max="5" width="22" customWidth="1"/>
    <col min="6" max="6" width="45" customWidth="1"/>
  </cols>
  <sheetData>
    <row r="1">
      <c r="A1" t="inlineStr"><is><t>BucketAI Categorization &amp; Remark Analysis Summary</t></is></c>
    </row>
    <row r="2">
      <c r="A2" t="inlineStr"><is><t>Workbook: ${escapeXml(fileName)} | Target Sheet: ${escapeXml(selectedSheetName)} | Generated: ${escapeXml(timestamp)}</t></is></c>
    </row>
    <row r="4">
      <c r="A4" t="inlineStr"><is><t>DATASET METRIC</t></is></c>
      <c r="B4" t="inlineStr"><is><t>VALUE</t></is></c>
      <c r="C4" t="inlineStr"><is><t>NOTES</t></is></c>
    </row>
    <row r="5">
      <c r="A5" t="inlineStr"><is><t>Total Input Records</t></is></c>
      <c r="B5"><v>${totalRows}</v></c>
      <c r="C5" t="inlineStr"><is><t>100% of rows preserved in original order</t></is></c>
    </row>
    <row r="6">
      <c r="A6" t="inlineStr"><is><t>Processed (Included)</t></is></c>
      <c r="B6"><v>${includedRows}</v></c>
      <c r="C6" t="inlineStr"><is><t>Evaluated by semantic discovery &amp; categorization</t></is></c>
    </row>
    <row r="7">
      <c r="A7" t="inlineStr"><is><t>Excluded by Filter Rules</t></is></c>
      <c r="B7"><v>${excludedRows}</v></c>
      <c r="C7" t="inlineStr"><is><t>Untouched in target worksheet</t></is></c>
    </row>
    <row r="8">
      <c r="A8" t="inlineStr"><is><t>Blank / No Remarks</t></is></c>
      <c r="B8"><v>${blankRows}</v></c>
      <c r="C8" t="inlineStr"><is><t>Explicit category for missing or empty text</t></is></c>
    </row>
    <row r="9">
      <c r="A9" t="inlineStr"><is><t>Discovered Categories</t></is></c>
      <c r="B9"><v>${discoveredCategoriesCount}</v></c>
      <c r="C9" t="inlineStr"><is><t>Semantic topic buckets discovered from remarks</t></is></c>
    </row>
    <row r="10">
      <c r="A10" t="inlineStr"><is><t>Review Required</t></is></c>
      <c r="B10"><v>${needsReviewRows}</v></c>
      <c r="C10" t="inlineStr"><is><t>Outliers or low-confidence borderlines</t></is></c>
    </row>
    <row r="13">
      <c r="A13" t="inlineStr"><is><t>CATEGORY DISTRIBUTION &amp; TAXONOMY</t></is></c>
    </row>
    <row r="14">
      <c r="A14" t="inlineStr"><is><t>Bucket_ID</t></is></c>
      <c r="B14" t="inlineStr"><is><t>Category Name</t></is></c>
      <c r="C14" t="inlineStr"><is><t>Total Rows</t></is></c>
      <c r="D14" t="inlineStr"><is><t>% of Included</t></is></c>
      <c r="E14" t="inlineStr"><is><t>Category Type</t></is></c>
      <c r="F14" t="inlineStr"><is><t>Description</t></is></c>
    </row>
    ${categoryRowsXml}
  </sheetData>
  <drawing r:id="rId1"/>
</worksheet>`;
}

/**
 * High-Fidelity Chart-Preserving & Chart-Generating Excel Exporter
 * 1. Preserves existing charts and worksheets in the input workbook.
 * 2. Injects enriched columns exclusively into the user-selected worksheet.
 * 3. Builds a dedicated BucketAI Summary worksheet with an embedded native Excel chart (Bar or Pie).
 */
export async function exportChartPreservingWorkbook(
  originalRows: RawRow[],
  allColumns: string[],
  assignments: Map<number, RowAssignment>,
  buckets: Bucket[],
  primaryKeyCol: string,
  selectedSheetName: string,
  preservationMeta?: WorkbookPreservationMeta,
  fileName = 'BucketAI_Categorized.xlsx',
  chartType: 'bar' | 'pie' = 'bar'
): Promise<{ method: 'chart_preserving_archive' | 'structured_multi_sheet'; featuresPreserved: string[] }> {
  const isXlsx = preservationMeta?.originalFileName?.endsWith('.xlsx') || fileName.endsWith('.xlsx');
  const bucketMap = new Map<string, Bucket>();
  buckets.forEach((b) => bucketMap.set(b.id, b));

  const totalRows = originalRows.length;
  const includedAssignments = Array.from(assignments.values()).filter((a) => !a.isExcludedByFilter);
  const includedRows = includedAssignments.length;
  const excludedRows = totalRows - includedRows;
  const needsReviewRows = includedAssignments.filter(
    (a) => a.confidence === 'Needs Review' || a.bucketId === 'bucket_outliers'
  ).length;

  // Chart categories and values (all non-empty buckets)
  const chartBuckets = buckets.filter((b) => b.totalRows > 0);
  const chartCatNames = chartBuckets.map((b) => b.name);
  const chartCounts = chartBuckets.map((b) => b.totalRows);

  // If user provided an XLSX with original file buffer, use deep container preservation & chart injection
  if (isXlsx && preservationMeta?.originalFileBuffer) {
    try {
      const zip = await JSZip.loadAsync(preservationMeta.originalFileBuffer);

      // 1. Locate the exact worksheet file corresponding to selectedSheetName
      let wbXml = await zip.file('xl/workbook.xml')?.async('string');
      let relsXml = await zip.file('xl/_rels/workbook.xml.rels')?.async('string');

      if (!wbXml || !relsXml) {
        throw new Error('Workbook metadata or relationships XML missing in archive.');
      }

      // Match sheet in workbook.xml by name
      const targetSheetRegex = new RegExp(`<sheet\\b[^>]*\\bname="${escapeXml(selectedSheetName)}"[^>]*\\br:id="([^"]+)"`, 'i');
      let sheetMatch = wbXml.match(targetSheetRegex);
      let targetRId = sheetMatch ? sheetMatch[1] : null;

      if (!targetRId) {
        const altSheetRegex = new RegExp(`<sheet\\b[^>]*\\br:id="([^"]+)"[^>]*\\bname="${escapeXml(selectedSheetName)}"`, 'i');
        const altMatch = wbXml.match(altSheetRegex);
        targetRId = altMatch ? altMatch[1] : null;
      }

      if (!targetRId) {
        throw new Error(`Selected worksheet "${selectedSheetName}" was not found in workbook archive.`);
      }

      // Resolve relationship target from workbook.xml.rels
      const relRegex = new RegExp(`<Relationship\\b[^>]*\\bId="${targetRId}"[^>]*\\bTarget="([^"]+)"`, 'i');
      let relMatch = relsXml.match(relRegex);
      if (!relMatch) {
        const altRelRegex = new RegExp(`<Relationship\\b[^>]*\\bTarget="([^"]+)"[^>]*\\bId="${targetRId}"`, 'i');
        relMatch = relsXml.match(altRelRegex);
      }

      if (!relMatch) {
        throw new Error(`Relationship for selected worksheet "${selectedSheetName}" (rId: ${targetRId}) was not found.`);
      }

      const rawTarget = relMatch[1];
      const targetSheetFile = rawTarget.startsWith('xl/')
        ? rawTarget
        : `xl/${rawTarget.replace(/^\//, '')}`;

      const targetFileObj = zip.file(targetSheetFile);
      if (!targetFileObj) {
        throw new Error(`Worksheet part "${targetSheetFile}" for sheet "${selectedSheetName}" was not found in archive.`);
      }

      let sheetXml = await targetFileObj.async('string');

      // 2. Column letters for the 5 newly appended columns
      const startColIdx = allColumns.length;
      const colLetters = [
        getExcelColumnLetter(startColIdx),
        getExcelColumnLetter(startColIdx + 1),
        getExcelColumnLetter(startColIdx + 2),
        getExcelColumnLetter(startColIdx + 3),
        getExcelColumnLetter(startColIdx + 4),
      ];

      // Update worksheet dimension
      const maxColLetter = colLetters[4];
      const maxRowIndex = originalRows.length + 1;
      const dimRegex = /<dimension\b[^>]*\bref="([^"]*)"\s*\/>/;
      if (dimRegex.test(sheetXml)) {
        sheetXml = sheetXml.replace(dimRegex, `<dimension ref="A1:${maxColLetter}${Math.max(maxRowIndex, 2)}"/>`);
      } else {
        sheetXml = sheetXml.replace(
          '<sheetViews>',
          `<dimension ref="A1:${maxColLetter}${Math.max(maxRowIndex, 2)}"/><sheetViews>`
        );
      }

      const headerAdditions = `
        <c r="${colLetters[0]}1" t="inlineStr"><is><t>Bucket_ID</t></is></c>
        <c r="${colLetters[1]}1" t="inlineStr"><is><t>Bucket_Name</t></is></c>
        <c r="${colLetters[2]}1" t="inlineStr"><is><t>Bucket_Description</t></is></c>
        <c r="${colLetters[3]}1" t="inlineStr"><is><t>Assignment_Confidence</t></is></c>
        <c r="${colLetters[4]}1" t="inlineStr"><is><t>Review_Required</t></is></c>
      `;

      // 3. Append new columns exclusively to rows on the selected worksheet
      sheetXml = sheetXml.replace(/<row\b([^>]*\br="(\d+)"[^>]*)>([\s\S]*?)<\/row>/g, (match, rowAttrs, rowNumStr, innerCells) => {
        const rowNum = parseInt(rowNumStr, 10);
        if (rowNum === 1) {
          return `<row ${rowAttrs}>${innerCells}${headerAdditions}</row>`;
        }

        const originalRowIndex = rowNum - 2;
        const assignment = assignments.get(originalRowIndex);

        if (!assignment || assignment.isExcludedByFilter) {
          // Write blank/empty values so excluded rows are never misaligned or shifted
          const emptyCells = `
            <c r="${colLetters[0]}${rowNum}" t="inlineStr"><is><t></t></is></c>
            <c r="${colLetters[1]}${rowNum}" t="inlineStr"><is><t></t></is></c>
            <c r="${colLetters[2]}${rowNum}" t="inlineStr"><is><t></t></is></c>
            <c r="${colLetters[3]}${rowNum}" t="inlineStr"><is><t></t></is></c>
            <c r="${colLetters[4]}${rowNum}" t="inlineStr"><is><t></t></is></c>
          `;
          return `<row ${rowAttrs}>${innerCells}${emptyCells}</row>`;
        }

        const bucket = bucketMap.get(assignment.bucketId);
        const bucketId = assignment.bucketId || '';
        const bucketName = escapeXml(assignment.bucketName || '');
        const bucketDesc = escapeXml(bucket?.description || '');
        const conf = assignment.confidence || 'Medium';
        const reviewReq =
          assignment.confidence === 'Needs Review' || assignment.bucketId === 'bucket_outliers' || bucket?.reviewRequired
            ? 'YES'
            : 'NO';

        const newCells = `
          <c r="${colLetters[0]}${rowNum}" t="inlineStr"><is><t>${bucketId}</t></is></c>
          <c r="${colLetters[1]}${rowNum}" t="inlineStr"><is><t>${bucketName}</t></is></c>
          <c r="${colLetters[2]}${rowNum}" t="inlineStr"><is><t>${bucketDesc}</t></is></c>
          <c r="${colLetters[3]}${rowNum}" t="inlineStr"><is><t>${conf}</t></is></c>
          <c r="${colLetters[4]}${rowNum}" t="inlineStr"><is><t>${reviewReq}</t></is></c>
        `;

        return `<row ${rowAttrs}>${innerCells}${newCells}</row>`;
      });

      // Write updated selected worksheet back
      zip.file(targetSheetFile, sheetXml);

      // 4. Create the dedicated BucketAI Summary worksheet with collision-safe name
      let summarySheetName = 'BucketAI Summary';
      if (wbXml.includes(`name="${summarySheetName}"`)) {
        summarySheetName = 'BucketAI Summary (1)';
      }

      const summarySheetFile = 'worksheets/sheet_bucketai_summary.xml';
      const summarySheetXml = generateOpenXmlSummarySheet(
        summarySheetName,
        preservationMeta?.originalFileName || fileName,
        selectedSheetName,
        buckets,
        totalRows,
        includedRows,
        excludedRows,
        needsReviewRows
      );
      zip.file(`xl/${summarySheetFile}`, summarySheetXml);

      // 5. Embed native Excel chart & drawing linked to the summary sheet
      const chartXml = generateOpenXmlChart(chartCatNames, chartCounts, summarySheetName, chartType);
      const drawingXml = generateOpenXmlDrawing();

      zip.file('xl/charts/chart_bucketai.xml', chartXml);
      zip.file('xl/drawings/drawing_bucketai.xml', drawingXml);
      zip.file(
        'xl/drawings/_rels/drawing_bucketai.xml.rels',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart_bucketai.xml"/>
</Relationships>`
      );

      zip.file(
        'xl/worksheets/_rels/sheet_bucketai_summary.xml.rels',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing_bucketai.xml"/>
</Relationships>`
      );

      // 6. Register new sheet and relationship in workbook.xml and workbook.xml.rels
      const sheetIdMatches = [...wbXml.matchAll(/sheetId="(\d+)"/g)].map((m) => parseInt(m[1], 10));
      const maxSheetId = Math.max(...sheetIdMatches, 0) + 1;

      const rIdMatches = [...relsXml.matchAll(/Id="rId(\d+)"/g)].map((m) => parseInt(m[1], 10));
      const nextRId = 'rId' + (Math.max(...rIdMatches, 0) + 1);

      wbXml = wbXml.replace(
        '</sheets>',
        `<sheet name="${escapeXml(summarySheetName)}" sheetId="${maxSheetId}" r:id="${nextRId}"/></sheets>`
      );
      zip.file('xl/workbook.xml', wbXml);

      relsXml = relsXml.replace(
        '</Relationships>',
        `<Relationship Id="${nextRId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="${summarySheetFile}"/></Relationships>`
      );
      zip.file('xl/_rels/workbook.xml.rels', relsXml);

      // 7. Update [Content_Types].xml
      let contentTypes = await zip.file('[Content_Types].xml')?.async('string');
      if (contentTypes) {
        if (!contentTypes.includes('chart_bucketai.xml')) {
          contentTypes = contentTypes.replace(
            '</Types>',
            `  <Override PartName="/xl/${summarySheetFile}" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/charts/chart_bucketai.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>
  <Override PartName="/xl/drawings/drawing_bucketai.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>
</Types>`
          );
          zip.file('[Content_Types].xml', contentTypes);
        }
      }

      const blob = await zip.generateAsync({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      triggerDownload(blob, fileName);
      return {
        method: 'chart_preserving_archive',
        featuresPreserved: [
          `Selected worksheet "${selectedSheetName}" enriched with 5 columns`,
          'All other worksheets, charts, and drawings 100% preserved',
          `Added dedicated "${summarySheetName}" with native Excel ${chartType === 'pie' ? 'Pie' : 'Bar'} chart`,
        ],
      };
    } catch (zipErr: any) {
      console.warn('Deep chart injection fell back to standard multi-sheet:', zipErr);
      if (zipErr.message?.includes('Selected worksheet')) {
        throw zipErr;
      }
    }
  }

  // Multi-sheet fallback
  exportStandardMultiSheet(
    originalRows,
    allColumns,
    assignments,
    buckets,
    selectedSheetName,
    fileName,
    chartType
  );
  return {
    method: 'structured_multi_sheet',
    featuresPreserved: [
      `Selected worksheet "${selectedSheetName}" enriched`,
      'All original rows, order, and keys preserved',
      'Dedicated BucketAI Summary worksheet created',
    ],
  };
}

function escapeXml(unsafe: string): string {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Standard Multi-Sheet Export
 */
export function exportStandardMultiSheet(
  originalRows: RawRow[],
  allColumns: string[],
  assignments: Map<number, RowAssignment>,
  buckets: Bucket[],
  selectedSheetName: string,
  fileName = 'BucketAI_Categorized.xlsx',
  chartType: 'bar' | 'pie' = 'bar'
): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Enriched Data for selected sheet
  const enrichedRows: any[] = originalRows.map((row) => {
    const assignment = assignments.get(row.__row_index__);
    const newRow: any = {};

    allColumns.forEach((col) => {
      newRow[col] = sanitizeCellValue(row[col]);
    });

    if (assignment && !assignment.isExcludedByFilter) {
      newRow['Bucket_ID'] = assignment.bucketId;
      newRow['Bucket_Name'] = sanitizeCellValue(assignment.bucketName);
      const b = buckets.find((item) => item.id === assignment.bucketId);
      newRow['Bucket_Description'] = sanitizeCellValue(b?.description || '');
      newRow['Assignment_Confidence'] = assignment.confidence;
      newRow['Review_Required'] =
        assignment.confidence === 'Needs Review' || assignment.bucketId === 'bucket_outliers' || b?.reviewRequired
          ? 'YES'
          : 'NO';
      newRow['Filter_Status'] = 'Included';
    } else {
      newRow['Bucket_ID'] = '';
      newRow['Bucket_Name'] = '';
      newRow['Bucket_Description'] = '';
      newRow['Assignment_Confidence'] = '';
      newRow['Review_Required'] = '';
      newRow['Filter_Status'] = 'Excluded by Filter';
    }

    return newRow;
  });

  const sheetTitle = selectedSheetName || 'Enriched_Data';
  const wsEnriched = XLSX.utils.json_to_sheet(enrichedRows);
  XLSX.utils.book_append_sheet(wb, wsEnriched, sheetTitle.slice(0, 31));

  // Sheet 2: BucketAI Summary
  const includedRows = Array.from(assignments.values()).filter((a) => !a.isExcludedByFilter);
  const totalIncluded = includedRows.length;

  const summaryRows = buckets.map((b) => ({
    Bucket_ID: b.id,
    Category_Name: sanitizeCellValue(b.name),
    Total_Rows: b.totalRows,
    Percentage_of_Included:
      totalIncluded > 0 ? `${((b.totalRows / totalIncluded) * 100).toFixed(1)}%` : '0%',
    Category_Type: b.isBlankBucket || b.id === 'bucket_blank'
      ? 'Blank / No Remarks'
      : b.isOutlierBucket
      ? 'Outlier / Needs Review'
      : 'Discovered Category',
    Description: sanitizeCellValue(b.description),
    Key_Phrases: sanitizeCellValue(b.keywords.join(', ')),
    Representative_Examples: sanitizeCellValue(b.sampleRemarks.slice(0, 3).join(' | ')),
  }));

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'BucketAI Summary');

  // Sheet 3: Needs Review Sheet
  const reviewRows = enrichedRows.filter((r) => r['Review_Required'] === 'YES');
  if (reviewRows.length > 0) {
    const wsReview = XLSX.utils.json_to_sheet(reviewRows);
    XLSX.utils.book_append_sheet(wb, wsReview, 'Needs_Review');
  }

  XLSX.writeFile(wb, fileName);
}
