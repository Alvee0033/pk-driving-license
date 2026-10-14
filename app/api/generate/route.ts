import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const BASE_DIR = process.cwd();

async function saveTempBase64(dataUrl: string | null | undefined, prefix: string): Promise<string | null> {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const clean = dataUrl.trim();
  if (!clean || clean === 'none' || clean.startsWith('blob:')) return null;

  try {
    let base64Data = clean;
    if (clean.includes(',')) {
      base64Data = clean.split(',')[1];
    }
    const buf = Buffer.from(base64Data, 'base64');
    if (buf.length === 0) return null;

    const tmpPath = path.join(os.tmpdir(), `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.png`);
    writeFileSync(tmpPath, buf);
    return tmpPath;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const tmpFiles: string[] = [];

  try {
    const body = await req.json();
    const {
      template = '1',
      data = {},
      photo = null,
      signature = null,
      auth = null,
      preview = true,
      download = false,
      format = 'png'
    } = body;

    const rawTemplate = String(template || '1').toLowerCase();
    const tId = (rawTemplate === '2' || rawTemplate.includes('2')) ? '2' : '1';
    const templateDir = path.join(BASE_DIR, 'templates', `template${tId}`);

    if (!existsSync(templateDir)) {
      return NextResponse.json({ error: `Template ${tId} directory not found` }, { status: 400 });
    }

    // Auto-detect domain and base_url from request if not explicitly provided in data
    const hostHeader = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3005';
    const protoHeader = req.headers.get('x-forwarded-proto') || (hostHeader.includes('localhost') ? 'http' : 'https');
    const enrichedData = {
      ...data,
      domain: (data && data.domain) ? data.domain : hostHeader,
      base_url: (data && data.base_url) ? data.base_url : `${protoHeader}://${hostHeader}`,
    };

    const ts = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const tmpJson = path.join(os.tmpdir(), `pk_data_${ts}.json`);
    const tmpOut  = path.join(os.tmpdir(), `pk_out_${ts}.png`);
    tmpFiles.push(tmpJson, tmpOut);

    writeFileSync(tmpJson, JSON.stringify(enrichedData, null, 2));

    const [photoTmp, sigTmp, authTmp] = await Promise.all([
      saveTempBase64(photo, 'pk_photo'),
      saveTempBase64(signature, 'pk_sig'),
      saveTempBase64(auth, 'pk_auth'),
    ]);
    if (photoTmp) tmpFiles.push(photoTmp);
    if (sigTmp)   tmpFiles.push(sigTmp);
    if (authTmp)  tmpFiles.push(authTmp);

    const isPdf = download && format === 'pdf';
    const outFormat = isPdf ? 'pdf' : (preview && !download ? 'jpg' : 'png');

    const args = [
      'generate.py',
      '--json', tmpJson,
      '--output', tmpOut,
      '--photo', photoTmp || (photo === 'none' ? 'none' : 'default'),
      '--signature', sigTmp || (signature === 'none' ? 'none' : 'default'),
      '--auth', authTmp || (auth === 'none' ? 'none' : 'default'),
      '--format', outFormat,
    ];

    if (preview && !download) {
      args.push('--preview');
    }

    await execFileAsync('python3', args, { cwd: templateDir, timeout: 15000 });

    if (!existsSync(tmpOut)) {
      return NextResponse.json({ error: 'Card generation failed to produce output' }, { status: 500 });
    }

    const imgBuf = readFileSync(tmpOut);

    if (download) {
      if (isPdf) {
        const filename = `DL_Template_${tId}_${(data.dl_no || 'card').replace(/\s+/g, '_')}.pdf`;
        return new NextResponse(new Uint8Array(imgBuf), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        });
      }

      const filename = `DL_Template_${tId}_${(data.dl_no || 'card').replace(/\s+/g, '_')}.png`;
      return new NextResponse(new Uint8Array(imgBuf), {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    const mime = (preview && !download) ? 'image/jpeg' : 'image/png';
    const base64 = imgBuf.toString('base64');
    return NextResponse.json({
      success: true,
      imageBase64: `data:${mime};base64,${base64}`,
    });

  } catch (err: any) {
    console.error('Error generating DL card:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  } finally {
    for (const f of tmpFiles) {
      try { if (existsSync(f)) unlinkSync(f); } catch {}
    }
  }
}
