import ExcelJS from 'exceljs';
import { Response } from 'express';

interface UserRow {
    fullName: string;
    email: string;
    phone: string;
    createdAt: Date;
}

export async function exportUsersToExcel(
    res: Response,
    users: UserRow[],
    sheetName: string,
    filename: string,
) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(sheetName);

    sheet.columns = [
        { header: 'Full Name', key: 'fullName', width: 30 },
        { header: 'Email', key: 'email', width: 35 },
        { header: 'Phone', key: 'phone', width: 18 },
        { header: 'Date', key: 'createdAt', width: 22 },
    ];

    // Style the header row
    sheet.getRow(1).font = { bold: true };

    users.forEach((u) => sheet.addRow(u));

    res.setHeader('Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition',
        `attachment; filename="${filename}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
}
