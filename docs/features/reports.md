# Reports and Export System

## Overview

The reports system provides comprehensive business intelligence and data export capabilities for the Retail POS application. Generate professional reports in multiple formats (Excel, PDF, CSV) covering sales, inventory, financial data, product performance, customer analytics, and tax compliance.

## Features

### Report Types

1. **Sales Report** - Detailed sales analysis with summaries
2. **Inventory Report** - Stock levels and valuation
3. **Financial Report** - Revenue, expenses, and profitability
4. **Products Report** - Product performance analysis
5. **Customers Report** - Customer behavior and lifetime value
6. **Tax Report** - AFIP compliance and invoice summary

### Export Formats

- **Excel (.xlsx)** - Rich formatting, multiple sheets, charts-ready
- **PDF (.pdf)** - Professional print-ready documents
- **CSV (.csv)** - Simple data export for analysis

### Key Capabilities

- **Date Range Filtering** - Generate reports for specific periods
- **Location Filtering** - Filter by store/location
- **Category Filtering** - Product category-specific reports
- **Automatic Calculations** - Summaries, totals, averages
- **Professional Formatting** - Color-coded, branded layouts
- **Direct Download** - Browser-native file downloads

## Architecture

### Directory Structure

```
src/modules/reports/
├── report.types.ts           # TypeScript types and enums
├── reports.module.ts          # NestJS module definition
├── reports.controller.ts      # API endpoints
├── reports.service.ts         # Business logic and data fetching
├── dto/
│   └── generate-report.dto.ts # Request validation
└── generators/
    ├── excel.generator.ts     # Excel file generation
    ├── pdf.generator.ts       # PDF generation with Puppeteer
    └── csv.generator.ts       # CSV generation
```

### Technology Stack

- **ExcelJS** - Excel file generation with rich formatting
- **Puppeteer** - HTML to PDF conversion
- **NestJS** - Controllers, services, dependency injection
- **Prisma** - Database queries and aggregations
- **TypeScript** - Type-safe report definitions

## Report Types

### 1. Sales Report

**Purpose**: Analyze sales performance, revenue, and transaction details.

**Data Included**:
- Individual sale records with customer information
- Payment method breakdown
- Location-wise sales
- Top-selling products
- Summary statistics (total sales, revenue, average ticket)

**Use Cases**:
- Daily/weekly/monthly sales analysis
- Payment method trends
- Location performance comparison
- Product popularity tracking

**Example**:
```bash
# Generate Excel sales report for last month
curl "http://localhost:3001/reports/sales?format=excel&startDate=2025-10-01&endDate=2025-10-31" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "x-user-id: $USER_ID" \
  --output sales-october.xlsx
```

### 2. Inventory Report

**Purpose**: Track stock levels, identify reorder needs, and calculate inventory value.

**Data Included**:
- Product SKU, name, category
- Current stock levels
- Min/max stock thresholds
- Cost and retail price
- Total inventory value
- Stock status (normal, low, out, excess)

**Color Coding**:
- 🟢 Normal - Adequate stock
- 🟡 Low Stock - Below minimum threshold
- 🔴 Out of Stock - Zero quantity
- 🔵 Excess - Above maximum threshold

**Use Cases**:
- Reorder decision making
- Dead stock identification
- Inventory valuation for accounting
- Stock level optimization

**Example**:
```bash
# Generate PDF inventory report
curl "http://localhost:3001/reports/inventory?format=pdf" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "x-user-id: $USER_ID" \
  --output inventory.pdf
```

### 3. Financial Report

**Purpose**: Comprehensive financial overview including revenue, expenses, and profitability.

**Data Included**:
- Revenue by payment method (cash, card, transfer, Mercado Pago)
- Expense categories (purchases, salaries, rent, utilities)
- Profit calculations (gross, net, margin %)
- Tax summary (collected, paid, pending)

**Metrics**:
- Total revenue
- Total expenses
- Gross profit = Revenue - Cost of Goods
- Net profit = Gross Profit - Operating Expenses
- Profit margin = (Net Profit / Revenue) × 100

**Use Cases**:
- Monthly financial statements
- Profitability analysis
- Budget vs actual comparison
- Tax planning

**Example**:
```bash
# Generate Q3 financial report
curl "http://localhost:3001/reports/financial?format=excel&startDate=2025-07-01&endDate=2025-09-30" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "x-user-id: $USER_ID" \
  --output q3-financial.xlsx
```

### 4. Products Report

**Purpose**: Analyze individual product performance and profitability.

**Data Included**:
- Units sold per product
- Revenue per product
- Profit per product
- Profit margin %
- Top performers and underperformers

**Rankings**:
- Top 5 best-selling products
- Bottom 5 underperforming products
- Category-wise performance

**Use Cases**:
- Product portfolio optimization
- Pricing strategy evaluation
- Marketing campaign targeting
- SKU rationalization

**Example**:
```bash
# Generate products report for electronics category
curl "http://localhost:3001/reports/products?format=excel&categoryId=cat_electronics" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "x-user-id: $USER_ID" \
  --output electronics-performance.xlsx
```

### 5. Customers Report

**Purpose**: Understand customer behavior, loyalty, and lifetime value.

**Data Included**:
- Customer contact information
- Total purchases per customer
- Total spent (lifetime value)
- Average ticket size
- Last purchase date
- New vs repeat customers

**Metrics**:
- Total customers
- New customers in period
- Repeat customer count
- Average spend per customer
- Customer retention rate

**Use Cases**:
- Loyalty program design
- Customer segmentation
- Retention campaigns
- VIP customer identification

**Example**:
```bash
# Generate customer analytics for 2025
curl "http://localhost:3001/reports/customers?format=pdf&startDate=2025-01-01&endDate=2025-12-31" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "x-user-id: $USER_ID" \
  --output customers-2025.pdf
```

### 6. Tax Report (AFIP)

**Purpose**: Argentine tax compliance reporting for AFIP submissions.

**Data Included**:
- Invoice numbers and types (A, B, C)
- Customer CUIT and name
- Net amount (base imponible)
- IVA (tax amount)
- Total amount
- CAE (Código de Autorización Electrónico)
- Approval status

**Summary**:
- Total invoices issued
- Total net amount
- Total IVA collected
- Breakdown by invoice type

**Use Cases**:
- Monthly AFIP declarations
- IVA book (Libro IVA)
- Tax audit preparation
- Revenue verification

**Example**:
```bash
# Generate tax report for January 2025
curl "http://localhost:3001/reports/tax?format=excel&startDate=2025-01-01&endDate=2025-01-31" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "x-user-id: $USER_ID" \
  --output afip-january-2025.xlsx
```

## API Reference

### Base Endpoint

```
GET /reports/generate
```

Generate any report type with specified format.

**Query Parameters**:
- `type` (required) - Report type: `sales`, `inventory`, `financial`, `products`, `customers`, `tax`
- `format` (required) - Export format: `excel`, `pdf`, `csv`
- `startDate` (optional) - Filter start date (ISO 8601)
- `endDate` (optional) - Filter end date (ISO 8601)
- `locationId` (optional) - Filter by location UUID
- `categoryId` (optional) - Filter by category UUID
- `productId` (optional) - Filter by product UUID (future)
- `status` (optional) - Filter by status (future)

**Headers**:
- `Authorization: Bearer {token}` - User authentication token
- `x-tenant-id: {tenantId}` - Tenant identifier
- `x-user-id: {userId}` - User identifier

**Response**:
- Binary file download with appropriate Content-Type
- Content-Disposition header triggers browser download

**Example**:
```bash
curl "http://localhost:3001/reports/generate?type=sales&format=excel&startDate=2025-10-01&endDate=2025-10-31" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "x-user-id: $USER_ID" \
  --output report.xlsx
```

### Shorthand Endpoints

Convenience endpoints for specific report types:

#### Sales Report
```
GET /reports/sales
```
**Parameters**: `format`, `startDate`, `endDate`, `locationId`

#### Inventory Report
```
GET /reports/inventory
```
**Parameters**: `format`, `locationId`, `categoryId`

#### Financial Report
```
GET /reports/financial
```
**Parameters**: `format`, `startDate`, `endDate`

#### Products Report
```
GET /reports/products
```
**Parameters**: `format`, `startDate`, `endDate`, `categoryId`

#### Customers Report
```
GET /reports/customers
```
**Parameters**: `format`, `startDate`, `endDate`

#### Tax Report
```
GET /reports/tax
```
**Parameters**: `format`, `startDate`, `endDate`

## Export Formats

### Excel (.xlsx)

**Features**:
- Multiple worksheets (for complex reports)
- Formatted headers with colors
- Auto-fitted columns
- Bold summary sections
- Currency formatting
- Color-coded status indicators
- Ready for pivot tables and charts

**Libraries**: ExcelJS

**Best For**:
- Data analysis in Excel/Sheets
- Further processing and filtering
- Creating charts and visualizations
- Sharing with accountants/analysts

**Example Output**:
- Header section with tenant name and report metadata
- Color-coded column headers
- Data rows with proper formatting
- Summary section with bold totals
- Additional sheets for top products, breakdowns

### PDF

**Features**:
- Professional print layout
- Branded header with gradient
- Responsive tables
- Summary boxes with highlights
- Page breaks for large reports
- Print-optimized margins
- Embedded styles (no external CSS)

**Libraries**: Puppeteer (headless Chrome)

**Best For**:
- Printing physical reports
- Email attachments
- Archive/record keeping
- Client presentations
- Non-editable distribution

**Styling**:
- Modern design with gradients
- Color-coded status badges
- Grid layouts for summaries
- Monospace fonts for numbers
- A4 paper format

### CSV

**Features**:
- Plain text format
- Comma-separated values
- UTF-8 encoding
- Quote escaping for special characters
- Summary rows included
- Universal compatibility

**Best For**:
- Import into other systems
- Database bulk loading
- Simple data transfer
- Email content (small files)
- Version control (text-based)

**Note**: CSV has no formatting - all styling is lost.

## Implementation Guide

### Adding a New Report Type

1. **Define Types** (`report.types.ts`)
```typescript
export enum ReportType {
  // ... existing types
  NEW_REPORT = 'new_report',
}

export interface NewReportData {
  items: Array<{
    // Define structure
  }>;
  summary: {
    // Define summaries
  };
}
```

2. **Fetch Data** (`reports.service.ts`)
```typescript
private async fetchNewReportData(
  options: ReportOptions,
): Promise<NewReportData> {
  const data = await this.prisma.newTable.findMany({
    where: { /* filters */ },
  });

  // Process and return
  return { items, summary };
}
```

3. **Implement Generators** (`generators/*.generator.ts`)
```typescript
// Excel
private async generateNewReport(workbook, data, metadata) {
  const worksheet = workbook.addWorksheet('New Report');
  this.addReportHeader(worksheet, metadata);
  // Add data rows
}

// PDF
private generateNewReportHTML(data, metadata): string {
  return this.getBaseHTML(metadata, `
    <!-- HTML content -->
  `);
}

// CSV
private generateNewReportCSV(data): string {
  const headers = ['Col1', 'Col2'];
  const rows = data.items.map(item => [/* map values */]);
  return this.arrayToCSV([headers, ...rows]);
}
```

4. **Add Endpoint** (`reports.controller.ts`)
```typescript
@Get('new-report')
async newReport(
  @Query('format') format: string = 'excel',
  @GetTenantId() tenantId: string,
  @GetUserId() userId: string,
  @Res() res: Response,
): Promise<void> {
  const dto: GenerateReportDto = {
    type: 'new_report' as any,
    format: format as any,
  };
  return this.generateReport(dto, tenantId, userId, res);
}
```

### Customizing Existing Reports

**Modify Data Fetching**:
Edit the corresponding `fetch*Data()` method in `reports.service.ts`

**Change Excel Formatting**:
Edit the generator method in `generators/excel.generator.ts`

**Update PDF Styles**:
Edit HTML and CSS in `generators/pdf.generator.ts`

**Add Filters**:
1. Add field to `GenerateReportDto`
2. Include in `ReportOptions.filters`
3. Use in Prisma query where clause

## Testing

### Manual Testing

#### 1. Sales Report
```bash
# Excel
curl "http://localhost:3001/reports/sales?format=excel" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "x-user-id: $USER_ID" \
  --output test-sales.xlsx

# PDF
curl "http://localhost:3001/reports/sales?format=pdf" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "x-user-id: $USER_ID" \
  --output test-sales.pdf

# CSV
curl "http://localhost:3001/reports/sales?format=csv" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "x-user-id: $USER_ID" \
  --output test-sales.csv
```

#### 2. Inventory Report
```bash
curl "http://localhost:3001/reports/inventory?format=excel" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "x-user-id: $USER_ID" \
  --output inventory.xlsx
```

#### 3. Financial Report
```bash
curl "http://localhost:3001/reports/financial?format=pdf&startDate=2025-10-01&endDate=2025-10-31" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "x-user-id: $USER_ID" \
  --output financial-oct.pdf
```

### Expected Results

✅ **Success Indicators**:
- File downloads successfully
- Correct file extension (.xlsx, .pdf, .csv)
- File opens without errors
- Data is formatted correctly
- Summaries calculate properly
- Filters work as expected
- No missing data

❌ **Common Issues**:
- 401 Unauthorized - Check token
- 403 Forbidden - Check tenant access
- Empty file - No data in date range
- Malformed file - Check generator logic
- Timeout - Report too large, add pagination

### Automated Testing

```typescript
describe('ReportsService', () => {
  it('should generate sales report', async () => {
    const options: ReportOptions = {
      type: ReportType.SALES,
      format: ReportFormat.EXCEL,
      tenantId: 'test-tenant',
      userId: 'test-user',
      filters: {},
    };

    const result = await service.generateReport(options);

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.filename).toContain('.xlsx');
    expect(result.mimeType).toContain('spreadsheet');
  });
});
```

## Performance Considerations

### Large Datasets

**Problem**: Reports with thousands of records can be slow or timeout.

**Solutions**:
1. **Pagination** - Limit to most recent N records
2. **Date Ranges** - Always use startDate/endDate filters
3. **Background Jobs** - Queue large reports with Bull
4. **Incremental Loading** - Stream data instead of loading all at once
5. **Caching** - Cache frequently run reports for 5-15 minutes

### Puppeteer Memory

**Problem**: PDF generation with Puppeteer uses significant memory.

**Solutions**:
1. **Single Browser Instance** - Reuse browser across requests
2. **Close Pages** - Always close page after PDF generation
3. **Limit Concurrent** - Process PDFs one at a time
4. **Use PDFKit** - For simple reports, PDFKit is lighter than Puppeteer

### Database Queries

**Problem**: Complex aggregations can slow down report generation.

**Solutions**:
1. **Indexes** - Ensure indexes on frequently filtered columns
2. **Denormalization** - Pre-calculate summaries in separate tables
3. **Read Replicas** - Run reports against read replica
4. **Materialized Views** - For complex aggregations

## Security

### Access Control

- **Authentication Required** - All endpoints require valid JWT
- **Tenant Isolation** - Reports only show tenant's own data
- **Role-Based Access** - Future: limit reports by user role

### Data Protection

- **No Data Persistence** - Reports generated on-the-fly, not stored
- **Secure Filters** - SQL injection prevention via Prisma
- **Audit Logging** - Log who generated which reports (future)

### Rate Limiting

Prevent abuse:
```typescript
@ThrottlerGuard() // Limit to 10 reports per minute
```

## Future Enhancements

### Planned Features

1. **Scheduled Reports**
   - Email daily/weekly/monthly reports automatically
   - Use Bull queue for scheduling
   - Email with SendGrid/SES

2. **Custom Reports**
   - Allow users to create custom report templates
   - Drag-and-drop column selection
   - Save report configurations

3. **Charts and Visualizations**
   - Embedded charts in Excel
   - Visual graphs in PDF
   - Interactive dashboards

4. **Report Templates**
   - Customizable branding
   - Logo upload
   - Color scheme selection

5. **Real-Time Reports**
   - WebSocket updates
   - Live dashboard
   - Auto-refresh

6. **Export to Cloud**
   - Save to Google Drive
   - Upload to Dropbox
   - AWS S3 archival

7. **Comparison Reports**
   - Year-over-year comparison
   - Period-over-period growth
   - Trend analysis

8. **Multi-Location Consolidated**
   - Aggregate across all locations
   - Location comparison charts
   - Franchise-level reporting

## Troubleshooting

### Report is Empty

**Cause**: No data matches the filters.

**Solution**:
- Check date range is correct
- Verify tenant has completed sales
- Remove filters and try again
- Check database for actual data

### Excel File Corrupted

**Cause**: Error during Excel generation.

**Solution**:
- Check server logs for errors
- Verify ExcelJS version compatibility
- Try CSV format to isolate issue
- Ensure all data fields are properly formatted

### PDF Generation Fails

**Cause**: Puppeteer issues or HTML errors.

**Solution**:
```bash
# Check Chromium installation
ls ~/.cache/puppeteer

# Re-install Puppeteer
cd apps/api
pnpm remove puppeteer
pnpm add puppeteer
```

### Timeout Errors

**Cause**: Report too large or database slow.

**Solution**:
- Reduce date range
- Add indexes to database
- Increase API timeout in nest-cli.json
- Consider background job processing

### Memory Issues

**Cause**: Too many Puppeteer instances or large datasets.

**Solution**:
```typescript
// Limit concurrent reports
const semaphore = new Semaphore(1); // One at a time
```

## Support

### Logs

Check API logs for errors:
```bash
tail -f apps/api/logs/app.log | grep Reports
```

### Debugging

Enable debug logging:
```typescript
// reports.service.ts
this.logger.debug(`Fetching data for ${options.type}...`);
this.logger.debug(`Found ${data.items.length} items`);
```

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Unsupported format" | Invalid format parameter | Use excel, pdf, or csv |
| "Unsupported report type" | Invalid type parameter | Check ReportType enum |
| "Unauthorized" | Missing/invalid token | Include Authorization header |
| "Forbidden" | Wrong tenant | Check x-tenant-id header |

## Resources

- **ExcelJS Docs**: https://github.com/exceljs/exceljs
- **Puppeteer Docs**: https://pptr.dev/
- **PDF Best Practices**: https://www.w3.org/WAI/WCAG21/Techniques/pdf/
- **AFIP Documentation**: https://www.afip.gob.ar/ws/

## License

This feature is part of the Retail POS System.
