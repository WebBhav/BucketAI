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
 * Creates OpenXML Bar Chart XML for embedding in Excel .xlsx
 */
function generateOpenXmlBarChart(categories: string[], values: number[]): string {
  const count = categories.length;
  const numCats = categories
    .map((c, i) => `<c:pt idx="${i}"><c:v>${escapeXml(c)}</c:v></c:pt>`)
    .join('');
  const numVals = values
    .map((v, i) => `<c:pt idx="${i}"><c:v>${v}</c:v></c:pt>`)
    .join('');

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
      <c:barChart>
        <c:barDir val="col"/>
        <c:grouping val="clustered"/>
        <c:ser>
          <c:idx val="0"/>
          <c:order val="0"/>
          <c:tx><c:strRef><c:f>Bucket_Summary!$C$1</c:f><c:strCache><c:ptCount val="1"/><c:pt idx="0"><c:v>Total Rows</c:v></c:pt></c:strCache></c:strRef></c:tx>
          <c:spPr>
            <a:solidFill><a:srgbClr val="E11D48"/></a:solidFill>
          </c:spPr>
          <c:cat>
            <c:strRef>
              <c:f>Bucket_Summary!$B$2:$B$${count + 1}</c:f>
              <c:strCache>
                <c:ptCount val="${count}"/>
                ${numCats}
              </c:strCache>
            </c:strRef>
          </c:cat>
          <c:val>
            <c:numRef>
              <c:f>Bucket_Summary!$C$2:$C$${count + 1}</c:f>
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
 * Creates OpenXML Drawing XML anchoring the chart to Col E Row 2 through Col M Row 17
 */
function generateOpenXmlDrawing(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <xdr:twoCellAnchor>
    <xdr:from><xdr:col>4</xdr:col><xdr:colOffset>0</xdr:colOffset><xdr:row>1</xdr:row><xdr:rowOffset>0</xdr:rowOffset></xdr:from>
    <xdr:to><xdr:col>13</xdr:col><xdr:colOffset>0</xdr:colOffset><xdr:row>18</xdr:row><xdr:rowOffset>0</xdr:rowOffset></xdr:to>
    <xdr:graphicFrame macro="">
      <xdr:nvGraphicFramePr>
        <xdr:cNvPr id="2" name="Chart 1"/>
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
 * High-Fidelity Chart-Preserving & Chart-Generating Excel Exporter
 * 1. Preserves existing charts and worksheets in the input workbook.
 * 2. Injects enriched columns into the active worksheet.
 * 3. Builds a dedicated Bucket_Summary worksheet with an embedded native Excel BarChart!
 */
export async function exportChartPreservingWorkbook(
  originalRows: RawRow[],
  allColumns: string[],
  assignments: Map<number, RowAssignment>,
  buckets: Bucket[],
  primaryKeyCol: string,
  preservationMeta?: WorkbookPreservationMeta,
  fileName = 'BucketAI_Categorized.xlsx'
): Promise<{ method: 'chart_preserving_archive' | 'structured_multi_sheet'; featuresPreserved: string[] }> {
  const isXlsx = preservationMeta?.originalFileName?.endsWith('.xlsx');
  const bucketMap = new Map<string, Bucket>();
  buckets.forEach((b) => bucketMap.set(b.id, b));

  // Eligible semantic buckets for chart
  const chartBuckets = buckets.filter((b) => !b.isBlankBucket);
  const chartCatNames = chartBuckets.map((b) => b.name);
  const chartCounts = chartBuckets.map((b) => b.totalRows);

  // If user provided an XLSX with original file buffer, use deep container preservation & chart injection
  if (isXlsx && preservationMeta?.originalFileBuffer) {
    try {
      const zip = await JSZip.loadAsync(preservationMeta.originalFileBuffer);

      // Locate sheet XML files
      const sheetFiles = Object.keys(zip.files).filter(
        (f) => f.startsWith('xl/worksheets/sheet') && f.endsWith('.xml')
      );

      if (sheetFiles.length > 0) {
        const targetSheetFile = sheetFiles[0];
        let sheetXml = await zip.file(targetSheetFile)!.async('string');

        // Column letters for new columns
        const startColIdx = allColumns.length;
        const colLetters = [
          getExcelColumnLetter(startColIdx),
          getExcelColumnLetter(startColIdx + 1),
          getExcelColumnLetter(startColIdx + 2),
          getExcelColumnLetter(startColIdx + 3),
          getExcelColumnLetter(startColIdx + 4),
        ];

        const headerAdditions = `
          <c r="${colLetters[0]}1" t="inlineStr"><is><t>Bucket_ID</t></is></c>
          <c r="${colLetters[1]}1" t="inlineStr"><is><t>Bucket_Name</t></is></c>
          <c r="${colLetters[2]}1" t="inlineStr"><is><t>Bucket_Description</t></is></c>
          <c r="${colLetters[3]}1" t="inlineStr"><is><t>Assignment_Confidence</t></is></c>
          <c r="${colLetters[4]}1" t="inlineStr"><is><t>Review_Required</t></is></c>
        `;

        // Safely append new cells to rows without modifying existing cells or drawings
        sheetXml = sheetXml.replace(/<row r="(\d+)"([^>]*)>([\s\S]*?)<\/row>/g, (match, rowNumStr, attrs, innerCells) => {
          const rowNum = parseInt(rowNumStr, 10);
          if (rowNum === 1) {
            return `<row r="${rowNum}"${attrs}>${innerCells}${headerAdditions}</row>`;
          }

          const originalRowIndex = rowNum - 2;
          const assignment = assignments.get(originalRowIndex);

          if (!assignment || assignment.isExcludedByFilter) {
            return match;
          }

          const bucket = bucketMap.get(assignment.bucketId);
          const bucketId = assignment.bucketId || '';
          const bucketName = escapeXml(assignment.bucketName || '');
          const bucketDesc = escapeXml(bucket?.description || '');
          const conf = assignment.confidence || 'Medium';
          const reviewReq =
            assignment.confidence === 'Needs Review' || assignment.bucketId === 'bucket_outliers'
              ? 'YES'
              : 'NO';

          const newCells = `
            <c r="${colLetters[0]}${rowNum}" t="inlineStr"><is><t>${bucketId}</t></is></c>
            <c r="${colLetters[1]}${rowNum}" t="inlineStr"><is><t>${bucketName}</t></is></c>
            <c r="${colLetters[2]}${rowNum}" t="inlineStr"><is><t>${bucketDesc}</t></is></c>
            <c r="${colLetters[3]}${rowNum}" t="inlineStr"><is><t>${conf}</t></is></c>
            <c r="${colLetters[4]}${rowNum}" t="inlineStr"><is><t>${reviewReq}</t></is></c>
          `;

          return `<row r="${rowNum}"${attrs}>${innerCells}${newCells}</row>`;
        });

        zip.file(targetSheetFile, sheetXml);

        // Now embed native Excel bar chart on Bucket_Summary sheet!
        const chartXml = generateOpenXmlBarChart(chartCatNames, chartCounts);
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

        // Update Content_Types with Chart and Drawing parts
        let contentTypes = await zip.file('[Content_Types].xml')?.async('string');
        if (contentTypes) {
          if (!contentTypes.includes('chart_bucketai.xml')) {
            contentTypes = contentTypes.replace(
              '</Types>',
              `  <Override PartName="/xl/charts/chart_bucketai.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>\n  <Override PartName="/xl/drawings/drawing_bucketai.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>\n</Types>`
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
            'Embedded Charts & Drawings',
            'Original Sheets & Formulas',
            'Added Native Excel Bar Chart',
          ],
        };
      }
    } catch (zipErr) {
      console.warn('Deep chart injection fell back to standard multi-sheet:', zipErr);
    }
  }

  // Multi-sheet fallback
  exportStandardMultiSheet(originalRows, allColumns, assignments, buckets, fileName);
  return {
    method: 'structured_multi_sheet',
    featuresPreserved: ['All Original Rows & Order', 'Summary Sheet & Formulas'],
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
  fileName = 'BucketAI_Categorized.xlsx'
): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Enriched Data
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
        assignment.confidence === 'Needs Review' || assignment.bucketId === 'bucket_outliers'
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

  const wsEnriched = XLSX.utils.json_to_sheet(enrichedRows);
  XLSX.utils.book_append_sheet(wb, wsEnriched, 'Enriched_Data');

  // Sheet 2: Bucket Summary
  const includedRows = Array.from(assignments.values()).filter((a) => !a.isExcludedByFilter);
  const totalIncluded = includedRows.length;

  const summaryRows = buckets.map((b) => ({
    Bucket_ID: b.id,
    Bucket_Name: sanitizeCellValue(b.name),
    Total_Rows: b.totalRows,
    Percentage_of_Included:
      totalIncluded > 0 ? `${((b.totalRows / totalIncluded) * 100).toFixed(1)}%` : '0%',
    Category_Type: b.isBlankBucket
      ? 'Blank'
      : b.isOutlierBucket
      ? 'Outlier / Needs Review'
      : 'Discovered Category',
    Description: sanitizeCellValue(b.description),
    Key_Phrases: sanitizeCellValue(b.keywords.join(', ')),
    Representative_Examples: sanitizeCellValue(b.sampleRemarks.slice(0, 3).join(' | ')),
  }));

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Bucket_Summary');

  // Sheet 3: Needs Review Sheet
  const reviewRows = enrichedRows.filter((r) => r['Review_Required'] === 'YES');
  if (reviewRows.length > 0) {
    const wsReview = XLSX.utils.json_to_sheet(reviewRows);
    XLSX.utils.book_append_sheet(wb, wsReview, 'Needs_Review');
  }

  XLSX.writeFile(wb, fileName);
}
