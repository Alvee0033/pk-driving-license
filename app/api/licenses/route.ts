import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'data', 'licenses.json');
const SEED_FILE = path.join(process.cwd(), 'data', 'seed.json');

const DEFAULT_SEEDS = [
  {
    "cnic": "1560404318045",
    "name": "Ahmad Khan",
    "father_name": "Gul Hamad",
    "dl_no": "110200123565",
    "license_type": "M.CAR,LTV",
    "issue_date": "14-01-2021",
    "expiry_date": "13-01-2026",
    "district": "Peshawar",
    "idp": "Not Issued",
    "initial_type_date": "M.CAR,LTV / 14-01-2021"
  },
  {
    "cnic": "1710125068937",
    "name": "MUHAMMAD USMAN",
    "father_name": "AMIR KHUSRO KHAN",
    "dl_no": "101971029159",
    "license_type": "M/Cycle Only",
    "issue_date": "23-01-2021",
    "expiry_date": "22-01-2031",
    "district": "PESHAWAR",
    "idp": "Not Issued",
    "initial_type_date": "M/Cycle Only / 23-01-2021",
    "blood_group": "A(+ve)",
    "gender": "MALE",
    "address": "Mohallah Amir Khusro Khan, Utmanzai, Charsadda"
  },
  {
    "cnic": "2170423658681",
    "name": "AKHTAR HUSSAIN",
    "father_name": "KHER MUHAMMAD",
    "dl_no": "11000950348",
    "license_type": "M/Cycle, LTV",
    "issue_date": "08.06.2015",
    "expiry_date": "07.06.2025",
    "district": "Abbottabad",
    "idp": "Not Issued",
    "initial_type_date": "M/Cycle, LTV / 08.06.2015",
    "blood_group": "AB+Ve",
    "gender": "Male",
    "address": "Po Sararogha Gargora Teh Sar Rarogha Distt S Waziristan"
  }
];

function getLicenses() {
  try {
    const dir = path.dirname(DB_FILE);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    if (!existsSync(DB_FILE)) {
      let initialData = DEFAULT_SEEDS;
      if (existsSync(SEED_FILE)) {
        try {
          initialData = JSON.parse(readFileSync(SEED_FILE, 'utf-8'));
        } catch {
          initialData = DEFAULT_SEEDS;
        }
      }
      writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
      return initialData;
    }

    const content = readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading licenses:', err);
    return DEFAULT_SEEDS;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('search') || searchParams.get('q') || searchParams.get('cnic') || searchParams.get('dl_no') || '').trim();

  const licenses = getLicenses();

  if (!q) {
    return NextResponse.json({ licenses });
  }

  const cleanQ = q.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  const match = licenses.find((l: any) => {
    const cnicClean = (l.cnic || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const dlClean = (l.dl_no || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return cnicClean === cleanQ || dlClean === cleanQ;
  });

  if (match) {
    return NextResponse.json({ found: true, license: match });
  }

  return NextResponse.json({ found: false, license: null });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const licenses = getLicenses();

    const cnicClean = (body.cnic || '').replace(/[^a-zA-Z0-9]/g, '');
    const dlClean = (body.dl_no || '').replace(/[^a-zA-Z0-9]/g, '');

    const existingIdx = licenses.findIndex((l: any) => {
      const c = (l.cnic || '').replace(/[^a-zA-Z0-9]/g, '');
      const d = (l.dl_no || '').replace(/[^a-zA-Z0-9]/g, '');
      return (cnicClean && c === cnicClean) || (dlClean && d === dlClean);
    });

    const newRecord = {
      cnic: body.cnic || '',
      name: body.name || '',
      father_name: body.relation || body.father_name || '',
      dl_no: body.dl_no || '',
      license_type: body.vehicle_class || body.license_type || 'M.CYCLE + M.CAR/JEEP ONLY',
      issue_date: body.issue_date || '',
      expiry_date: body.validity_nt || body.expiry_date || '',
      district: body.auth_office || body.district || 'Peshawar',
      idp: body.idp || 'Not Issued',
      initial_type_date: body.initial_type_date || `${body.vehicle_class || 'M.CYCLE'} / ${body.issue_date || ''}`,
      blood_group: body.blood_group || '',
      gender: body.gender || 'Male',
      address: body.address || '',
    };

    if (existingIdx >= 0) {
      licenses[existingIdx] = { ...licenses[existingIdx], ...newRecord };
    } else {
      licenses.push(newRecord);
    }

    writeFileSync(DB_FILE, JSON.stringify(licenses, null, 2));
    return NextResponse.json({ success: true, license: newRecord });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = (searchParams.get('id') || searchParams.get('dl_no') || searchParams.get('cnic') || '').trim();
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const licenses = getLicenses();
    const cleanId = id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    const filtered = licenses.filter((l: any) => {
      const c = (l.cnic || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const d = (l.dl_no || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      return c !== cleanId && d !== cleanId;
    });

    writeFileSync(DB_FILE, JSON.stringify(filtered, null, 2));
    return NextResponse.json({ success: true, remaining: filtered.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

