import os
import json
import argparse
import qrcode
from PIL import Image, ImageDraw, ImageFont, ImageChops, ImageFilter

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BG_PATH = os.path.join(BASE_DIR, "background.png")

def get_font(size, bold=True):
    candidates = [
        os.path.join(BASE_DIR, "..", "..", "fonts", "LiberationSans-Bold.ttf" if bold else "LiberationSans-Regular.ttf"),
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

def apply_side_fade_blend(img, inset_x=16, inset_y=6, blur_radius=10):
    """
    Feathers and fades photo edges smoothly into the background,
    eliminating harsh rectangular border lines for authentic Abbottabad card blending.
    """
    w, h = img.size
    rgba = img.convert("RGBA")
    r, g, b, a = rgba.split()

    mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(mask)
    draw.rectangle((inset_x, inset_y, w - inset_x, h - inset_y), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(blur_radius))

    final_a = ImageChops.darker(a, mask)
    return Image.merge("RGBA", (r, g, b, final_a))

def render_template_1(data, photo_path=None, sig_path=None, auth_path=None, output_path=None, preview=False, out_format="png"):
    card = Image.open(BG_PATH).convert("RGBA")
    draw = ImageDraw.Draw(card)

    font_bold_xl = get_font(33, True)
    font_bold_md = get_font(30, True)
    font_reg_sm  = get_font(22, False)

    # 1. Driver Photo
    if str(photo_path).lower() == "default" or (not photo_path and not data.get("empty_photo")):
        sample_png = os.path.join(BASE_DIR, "sample_photo.png")
        sample_jpg = os.path.join(BASE_DIR, "sample_photo.jpg")
        photo_path = sample_png if os.path.exists(sample_png) else (sample_jpg if os.path.exists(sample_jpg) else None)

    if photo_path and os.path.exists(photo_path) and str(photo_path).lower() != "none":
        try:
            photo = Image.open(photo_path).convert("RGBA")
            pw, ph = photo.size
            aspect = pw / float(ph or 1)

            # Center inside the white circle (center: x=910, y=350)
            cx, cy = 910, 350
            max_w, max_h = 185, 225

            if aspect > (max_w / float(max_h)):
                target_w = max_w
                target_h = max(1, int(target_w / aspect))
            else:
                target_h = max_h
                target_w = max(1, int(target_h * aspect))

            photo_resized = photo.resize((target_w, target_h), Image.Resampling.LANCZOS)
            photo_faded = apply_side_fade_blend(photo_resized, inset_x=16, inset_y=6, blur_radius=10)
            pos_x = cx - (target_w // 2)
            pos_y = cy - (target_h // 2)
            card.alpha_composite(photo_faded, (pos_x, pos_y))
        except Exception as e:
            print(f"Photo error: {e}")

    # Fallback to default template values if user didn't enter something
    dl_no = (data.get("dl_no") or data.get("dl_number") or data.get("license_number") or "").strip() or "11000950348"
    draw.text((314, 290), dl_no, fill=(15, 15, 15), font=font_bold_xl)

    name = (data.get("name") or "").strip() or "AKHTAR HUSSAIN"
    draw.text((314, 338), name.upper(), fill=(15, 15, 15), font=font_bold_xl)

    relation = (data.get("relation") or data.get("father_name") or data.get("fatherName") or data.get("relation_name") or "").strip() or "KHER MUHAMMAD"
    draw.text((314, 385), relation.upper(), fill=(15, 15, 15), font=font_bold_xl)

    dob = (data.get("dob") or "").strip() or "05 May 1995"
    draw.text((490, 425), dob, fill=(20, 20, 20), font=font_bold_md)

    cnic = (data.get("cnic") or "").strip() or "2170423658681"
    draw.text((490, 467), cnic, fill=(20, 20, 20), font=font_bold_md)

    gender = (data.get("gender") or "").strip() or "Male"
    draw.text((490, 510), gender.capitalize(), fill=(20, 20, 20), font=font_bold_md)

    issue_date = (data.get("issue_date") or "").strip() or "08.06.2015"
    draw.text((490, 553), issue_date, fill=(20, 20, 20), font=font_bold_md)

    validity_nt = (data.get("validity_nt") or data.get("valid_to") or data.get("expiry_date") or "").strip() or "07.06.2025"
    draw.text((490, 596), validity_nt, fill=(20, 20, 20), font=font_bold_md)

    # 10. Issuing Authority Stamp / Signature (front above Issuing Authority)
    # Default authority signature: /home/alvee/Desktop/Screenshot_20260916_210016.png
    auth_file = None
    if auth_path and os.path.exists(auth_path) and str(auth_path).lower() not in ("none", "default"):
        auth_file = auth_path
    elif str(auth_path).lower() != "none":
        default_auth = os.path.join(BASE_DIR, "default_auth_sig.png")
        if os.path.exists(default_auth):
            auth_file = default_auth
        elif os.path.exists("/home/alvee/Desktop/Screenshot_20260916_210016.png"):
            auth_file = "/home/alvee/Desktop/Screenshot_20260916_210016.png"

    if auth_file and os.path.exists(auth_file):
        try:
            raw_stamp = Image.open(auth_file)
            clean_stamp = clean_transparent_cutout(raw_stamp, is_stamp=True)
            target_w = 160
            target_h = min(70, int(clean_stamp.height * (target_w / float(clean_stamp.width or 1))))
            sig_x = 880 - (target_w // 2)
            card.alpha_composite(clean_stamp, (sig_x, 485))
        except Exception as e:
            print(f"Auth stamp error: {e}")

    # 11. Back: Address
    address = (data.get("address") or "").strip() or "Po Sararogha Gargora Teh Sar Rarogha Distt S Waziristan"
    addr_size = 32
    addr_font = get_font(addr_size, True)
    while addr_size > 22 and (addr_font.getbbox(address)[2] - addr_font.getbbox(address)[0]) > 920:
        addr_size -= 1
        addr_font = get_font(addr_size, True)
    draw.text((117, 822), address, fill=(15, 15, 15), font=addr_font)

    # 12. Back: Blood Group
    blood = (data.get("blood_group") or "").strip() or "AB+Ve"
    draw.text((117, 898), blood, fill=(15, 15, 15), font=get_font(31, True))

    # 13. Back: Emergency Contact is already pre-printed on template background (0310-9901541); do not overwrite


    # 14. Back: QR Code (auto updates according to current live domain & provided link format)
    qr_data = (data.get("qr_data") or "").strip()
    if not qr_data and dl_no:
        base_url = (data.get("base_url") or "").rstrip("/")
        if not base_url:
            domain = (data.get("domain") or data.get("website") or "dlvkpk-pk.com").strip()
            if "://" not in domain:
                protocol = "http" if ("localhost" in domain or "127.0.0.1" in domain) else "https"
                base_url = f"{protocol}://{domain}"
            else:
                base_url = domain
        clean_dl = dl_no.replace(' ', '').replace('-', '')
        qr_data = f"{base_url.rstrip('/')}/dl-status/{clean_dl}"
    if qr_data:
        try:
            qr = qrcode.QRCode(box_size=8, border=2)
            qr.add_data(qr_data)
            qr.make(fit=True)
            qr_img = qr.make_image(fill_color="black", back_color="white").convert("RGBA")
            qr_img = qr_img.resize((215, 215), Image.Resampling.LANCZOS)
            card.paste(qr_img, (786, 1131))
        except Exception as e:
            print(f"QR error: {e}")

    # 15. Back: Holder Signature
    # Default holder signature: /home/alvee/Music/images.jpeg
    holder_file = None
    if sig_path and os.path.exists(sig_path) and str(sig_path).lower() not in ("none", "default"):
        holder_file = sig_path
    elif str(sig_path).lower() != "none":
        default_holder = os.path.join(BASE_DIR, "default_holder_sig.jpg")
        if os.path.exists(default_holder):
            holder_file = default_holder
        elif os.path.exists("/home/alvee/Music/images.jpeg"):
            holder_file = "/home/alvee/Music/images.jpeg"

    if holder_file and os.path.exists(holder_file):
        try:
            raw_sig = Image.open(holder_file)
            clean_sig = clean_transparent_cutout(raw_sig, is_stamp=False)
            target_w = 200
            target_h = min(70, int(clean_sig.height * (target_w / float(clean_sig.width or 1))))
            clean_sig = clean_sig.resize((target_w, target_h), Image.Resampling.LANCZOS)
            card.alpha_composite(clean_sig, (105, 1240))
        except Exception as e:
            print(f"Holder sig error: {e}")

    # 16. Back: Website text at bottom center (auto updates according to domain, dynamically centered)
    domain_text = (data.get("domain") or data.get("website") or "dlvkpk-pk.com").strip()
    if "://" in domain_text:
        domain_text = domain_text.split("://")[1].split("/")[0]
    bbox = font_reg_sm.getbbox(domain_text)
    tw = bbox[2] - bbox[0]
    draw.text(((1000 - tw) // 2, 1342), domain_text, fill=(40, 40, 40), font=font_reg_sm)

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

    render_template_1(
        data=data,
        photo_path=args.photo,
        sig_path=args.signature,
        auth_path=args.auth,
        output_path=args.output,
        preview=args.preview,
        out_format=args.format
    )
