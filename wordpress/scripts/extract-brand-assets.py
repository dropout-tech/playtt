"""Extract original PDF vector artwork; never trace or redraw the wordmark.

Requires PyMuPDF. Run from any directory. Coordinates are PDF points, 1-based
pages in the output manifest. The supplied PDF remains byte-for-byte intact.
"""
from pathlib import Path
import hashlib
import json
import fitz

repo = Path(__file__).resolve().parents[2]
source = repo / 'docs/brand/source/lets-play-brand-definition-and-visual-design.pdf'
expected = 'ab20c9a0da143a0874b3d6218f1af3f97e6dce3deef5bab40590f1f47eb8135b'
assert hashlib.sha256(source.read_bytes()).hexdigest() == expected
destination = repo / 'wordpress/lets-play/assets/images'
art = {
    'brand-logo': (17, (380, 410, 725, 675)),
    'brand-dong': (19, (76, 0, 366, 538)),
    'brand-kii': (19, (660, 0, 955, 538)),
    'brand-pa': (19, (1252, 0, 1548, 538)),
    'brand-ka': (19, (366, 539, 660, 1080)),
    'brand-ko': (19, (956, 539, 1250, 1080)),
    'brand-siou': (19, (1549, 539, 1842, 1080)),
}
manifest = {'source': source.relative_to(repo).as_posix(), 'sourceSha256': expected,
            'method': 'Original PDF vector paths clipped without recoloring or redrawing',
            'pymupdf': fitz.VersionBind, 'assets': []}
with fitz.open(source) as doc:
    for name, (page_number, box) in art.items():
        clip = fitz.Rect(box)
        with fitz.open() as out:
            page = out.new_page(width=clip.width, height=clip.height)
            page.show_pdf_page(page.rect, doc, page_number-1, clip=clip)
            data = page.get_svg_image(text_as_path=True).encode('utf-8')
        assert b'<image' not in data and b'<script' not in data
        target = destination / (name + '.svg')
        target.write_bytes(data)
        manifest['assets'].append({'path': target.relative_to(repo).as_posix(),
            'page': page_number, 'crop': box, 'bytes': len(data),
            'sha256': hashlib.sha256(data).hexdigest()})
(repo / 'docs/brand/assets.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps({'vectorAssets': len(art), 'sourceUnchanged': True}))
