import os
import json
import argparse
import qrcode
from PIL import Image, ImageDraw, ImageFont, ImageChops

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BG_PATH = os.path.join(BASE_DIR, "background.png")
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", ".."))
SEAL_PATH = os.path.join(ROOT_DIR, "seal.png")

def get_font(size, bold=True):
    candidates = [
        os.path.join(ROOT_DIR, "fonts", "LiberationSans-Bold.ttf" if bold else "LiberationSans-Regular.ttf"),
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/dejavu/DejaVuSans.ttf",
    ]
    for p in candidates:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

def clean_transparent_cutout(img, is_stamp=False):
    """
    Strips away solid white/light background from scanned/uploaded signatures or stamps,
    leaving crisp, transparent anti-aliased ink lines without any white box artifact.
    Optimized pure-Pillow implementation: zero numpy dependency, instant C-speed execution.
    """
    rgba = img.convert("RGBA")
    r, g, b, a = rgba.split()
    gray = rgba.convert("L")
    new_a = gray.point(lambda v: int(max(0, min(255, (230 - v) * (255.0 / 110.0)))))
    final_a = ImageChops.darker(a, new_a)

    if not is_stamp:
        r = r.point(lambda v: min(30, int(v * 0.45)))
        g = g.point(lambda v: min(30, int(v * 0.45)))
        b = b.point(lambda v: min(40, int(v * 0.45)))

    return Image.merge("RGBA", (r, g, b, final_a))

def render_template_2(data, photo_path=None, sig_path=None, auth_path=None, output_path=None, preview=False, out_format="png"):
    card = Image.open(BG_PATH).convert("RGBA")
    draw = ImageDraw.Draw(card)

    font_name_lg = get_font(32, True)
    font_val_front = get_font(30, True)
    font_val_back = get_font(29, True)
    font_addr_back = get_font(26, True)
    font_qr_cnic = get_font(20, True)
    font_web = get_font(22, True)

    # 1. Front Driver Photo (transparent RGBA, preserving aspect ratio, no white backdrop)
    if str(photo_path).lower() == "default" or (not photo_path and not data.get("empty_photo")):
        sample_png = os.path.join(BASE_DIR, "sample_photo.png")
        sample_jpg = os.path.join(BASE_DIR, "sample_photo.jpg")
        photo_path = sample_png if os.path.exists(sample_png) else (sample_jpg if os.path.exists(sample_jpg) else None)

    photo_img_loaded = None
    if photo_path and os.path.exists(photo_path) and str(photo_path).lower() != "none":
        try:
            photo_img_loaded = Image.open(photo_path).convert("RGBA")
            pw, ph = photo_img_loaded.size
            aspect = pw / float(ph)

            fw, fh = 280, 330
            f_aspect = fw / float(fh)

            if 0.80 <= aspect <= 1.20:
                crop_y0 = int(ph * 0.08)
                crop_y1 = int(ph * 0.86)
                crop_h = crop_y1 - crop_y0
                crop_w = int(crop_h * f_aspect)
                crop_x0 = max(0, (pw - crop_w) // 2)
                p_cropped = photo_img_loaded.crop((crop_x0, crop_y0, crop_x0 + crop_w, crop_y1))
                p_front = p_cropped.resize((fw, fh), Image.Resampling.LANCZOS)
                card.alpha_composite(p_front, (815, 190))
            else:
                p_front = photo_img_loaded.resize((fw, fh), Image.Resampling.LANCZOS)
                card.alpha_composite(p_front, (815, 190))
        except Exception as e:
            print(f"Front photo error: {e}")

    # 2. Semi-transparent Hologram Seal overlay on front photo
    seal_file = SEAL_PATH if os.path.exists(SEAL_PATH) else os.path.join(BASE_DIR, "seal.png")
    if os.path.exists(seal_file):
        try:
            seal = Image.open(seal_file).convert("RGBA")
            dia = 224
            seal = seal.resize((dia, dia), Image.Resampling.LANCZOS)
            r, g, b, a = seal.split()
            a = a.point(lambda p: int(p * 0.40))
            seal.putalpha(a)
            card.alpha_composite(seal, (676, 272))
        except Exception as e:
            print(f"Seal overlay error: {e}")

    # Fallback to default template values if user didn't enter something
    name = (data.get("name") or "").strip() or "MUHAMMAD YASEEN KHAN"
    draw.text((168, 230), name.upper(), fill=(15, 15, 15), font=font_name_lg)

    relation = (data.get("relation") or data.get("father_name") or data.get("fatherName") or "").strip() or "EJAZ AHMAD"
    draw.text((168, 275), relation.upper(), fill=(15, 15, 15), font=font_name_lg)

    cnic = (data.get("cnic") or "").strip() or "1710125068937"
    draw.text((420, 323), cnic, fill=(15, 15, 15), font=font_val_front)

    dob = (data.get("dob") or "").strip() or "06-01-1998"
    draw.text((420, 371), dob, fill=(15, 15, 15), font=font_val_front)

    dl_no = (data.get("dl_no") or data.get("dl_number") or data.get("license_number") or "").strip() or "101971029159"
    draw.text((420, 416), dl_no, fill=(15, 15, 15), font=font_val_front)

    issue_date = (data.get("issue_date") or "").strip() or "23-01-2021"
    draw.text((420, 464), issue_date, fill=(15, 15, 15), font=font_val_front)

    validity_nt = (data.get("validity_nt") or data.get("expiry_date") or "").strip() or "22-01-2031"
    draw.text((420, 513), validity_nt, fill=(15, 15, 15), font=font_val_front)

    # 5. Issuing Authority Stamp & Signature (Above ISSUING AUTHORITY PESHAWAR)
    # Default authority signature: /home/alvee/Desktop/Screenshot_20260916_210016.png
    auth_file = None
    if auth_path and os.path.exists(auth_path) and str(auth_path).lower() not in ("none", "default"):
        auth_file = auth_path
    elif sig_path and os.path.exists(sig_path) and str(sig_path).lower() not in ("none", "default"):
        auth_file = sig_path
    elif str(auth_path).lower() != "none" and str(sig_path).lower() != "none":
        default_auth = os.path.join(BASE_DIR, "default_auth_sig.png")
        if os.path.exists(default_auth):
            auth_file = default_auth
        elif os.path.exists("/home/alvee/Desktop/Screenshot_20260916_210016.png"):
            auth_file = "/home/alvee/Desktop/Screenshot_20260916_210016.png"

    if auth_file and os.path.exists(auth_file):
        try:
            raw_stamp = Image.open(auth_file)
            clean_stamp = clean_transparent_cutout(raw_stamp, is_stamp=True)
            target_w = 150
            target_h = min(80, int(clean_stamp.height * (target_w / float(clean_stamp.width or 1))))
            clean_stamp = clean_stamp.resize((target_w, target_h), Image.Resampling.LANCZOS)
            card.alpha_composite(clean_stamp, (890, 510))
        except Exception as e:
            print(f"Auth stamp error: {e}")

    # 6. Back Card Details
    blood = (data.get("blood_group") or "").strip() or "A(+ve)"
    draw.text((475, 993), blood, fill=(15, 15, 15), font=font_val_back)

    gender = (data.get("gender") or "").strip() or "MALE"
    draw.text((475, 1034), gender.upper(), fill=(15, 15, 15), font=font_val_back)

    emer = (data.get("emergency_contact") or "").strip() or "03332283318"
    draw.text((475, 1084), emer, fill=(15, 15, 15), font=font_val_back)

    address = (data.get("address") or "").strip() or "Mohallah Amir Khusro Khan, Utmanzai,\nTehsil and District Charsadda"
    if "\n" in address:
        lines = address.split("\n")
        draw.text((475, 1134), lines[0].strip(), fill=(15, 15, 15), font=font_addr_back)
        if len(lines) > 1:
            draw.text((475, 1167), lines[1].strip(), fill=(15, 15, 15), font=font_addr_back)
    else:
        words = address.split()
        l1, l2 = "", ""
        for w in words:
            if len(l1 + " " + w) <= 42:
                l1 = (l1 + " " + w).strip()
            else:
                l2 = (l2 + " " + w).strip()
        draw.text((475, 1134), l1, fill=(15, 15, 15), font=font_addr_back)
        if l2:
            draw.text((475, 1167), l2, fill=(15, 15, 15), font=font_addr_back)

    # 7. Back: Small Driver Photo (B&W Grayscale RGBA)
    if photo_img_loaded:
        try:
            pw, ph = photo_img_loaded.size
            bw, bh = 135, 155
            b_aspect = bw / float(bh)
            if 0.80 <= (pw / float(ph)) <= 1.20:
                crop_y0 = int(ph * 0.08)
                crop_y1 = int(ph * 0.86)
                crop_h = crop_y1 - crop_y0
                crop_bw = int(crop_h * b_aspect)
                crop_bx0 = max(0, (pw - crop_bw) // 2)
                p_back_crop = photo_img_loaded.crop((crop_bx0, crop_y0, crop_bx0 + crop_bw, crop_y1)).resize((bw, bh), Image.Resampling.LANCZOS)
            else:
                p_back_crop = photo_img_loaded.resize((bw, bh), Image.Resampling.LANCZOS)

            gray = p_back_crop.convert("L")
            _, _, _, alpha = p_back_crop.split()
            p_back_bw = Image.merge("RGBA", (gray, gray, gray, alpha))
            card.alpha_composite(p_back_bw, (215, 1250))
        except Exception as e:
            print(f"Back photo error: {e}")

    # 8. Back: QR Code inside gray rounded box (auto updates according to current live domain)
    qr_data = (data.get("qr_data") or "").strip()
    if not qr_data:
        search_val = dl_no or cnic or "110200123565"
        base_url = (data.get("base_url") or "").rstrip("/")
        if not base_url:
            domain = (data.get("domain") or data.get("website") or "ptpkp-gov.net").strip()
            if "://" not in domain:
                protocol = "http" if ("localhost" in domain or "127.0.0.1" in domain) else "https"
                base_url = f"{protocol}://{domain}"
            else:
                base_url = domain
        clean_search = search_val.replace('-', '').replace(' ', '')
        qr_data = f"{base_url.rstrip('/')}/index.php?search={clean_search}&sub="

    if qr_data:
        try:
            qr = qrcode.QRCode(box_size=10, border=1)
            qr.add_data(qr_data)
            qr.make(fit=True)
            qr_img = qr.make_image(fill_color="black", back_color="white").convert("RGBA")
            qr_img = qr_img.resize((260, 260), Image.Resampling.LANCZOS)
            card.paste(qr_img, (826, 1215))
        except Exception as e:
            print(f"QR error: {e}")

    # 9. CNIC under QR code
    display_cnic = cnic.replace("-", "").replace(" ", "") if cnic else "1710125068937"
    draw.text((880, 1485), display_cnic, fill=(20, 20, 20), font=font_qr_cnic)

    # 10. Website text at bottom center (auto updates according to domain, dynamically centered)
    domain_text = (data.get("domain") or data.get("website") or "ptpkp-govpk.com").strip()
    if "://" in domain_text:
        domain_text = domain_text.split("://")[1].split("/")[0]
    bbox = font_web.getbbox(domain_text)
    tw = bbox[2] - bbox[0]
    draw.text(((1197 - tw) // 2, 1512), domain_text, fill=(30, 30, 30), font=font_web)

    # Save
    if output_path:
        out_img = card.convert("RGB")
        if preview:
            out_img.thumbnail((750, 1125), Image.Resampling.BILINEAR)
            out_img.save(output_path, "JPEG", quality=82)
        elif out_format.lower() == "pdf" or output_path.lower().endswith(".pdf"):
            out_img.save(output_path, "PDF", resolution=300.0)
        else:
            out_img.save(output_path, "PNG", compress_level=4)

    return card

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", required=True)
    parser.add_argument("--photo", default="default")
    parser.add_argument("--signature", default="none")
    parser.add_argument("--auth", default="none")
    parser.add_argument("--output", required=True)
    parser.add_argument("--preview", action="store_true")
    parser.add_argument("--format", default="png")
    args = parser.parse_args()

    data = {}
    if os.path.exists(args.json):
        with open(args.json, "r") as f:
            data = json.load(f)
    else:
        try:
            data = json.loads(args.json)
        except Exception:
            try:
                data = json.loads(args.json.replace("\n", "\\n").replace("\r", ""))
            except Exception:
                pass

    render_template_2(
        data=data,
        photo_path=args.photo,
        sig_path=args.signature,
        auth_path=args.auth,
        output_path=args.output,
        preview=args.preview,
        out_format=args.format
    )
