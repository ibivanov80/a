"""Render the shared articulated 3D action plates using the local SceneKit executable."""
import argparse
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / 'scripts/rescue-cinema-art'
LOCATIONS = {
    'wolf': 'winter', 'cub': 'winter', 'penguin': 'winter', 'bear': 'autumn',
    'fox': 'summer', 'hare': 'summer', 'owl': 'autumn', 'mouse': 'autumn',
    'frog': 'pond', 'cat': 'pond', 'hedgehog': 'autumn',
}

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('renderer', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--poses',type=Path,required=True,help='Prepared frames from poses.py')
    parser.add_argument('--species',nargs='*',choices=LOCATIONS)
    parser.add_argument('--skip-existing',action='store_true')
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    for species, location in LOCATIONS.items():
        if args.species and species not in args.species: continue
        for variation in ['A', 'B', 'C']:
            if species == 'cub' and variation != 'A':
                continue
            stem = args.output / f'{species}-{variation}'
            if args.skip_existing and stem.with_name(stem.name + '-end.jpg').is_file(): continue
            source = ART / f'{location}.jpg'
            subprocess.run([args.renderer, species, variation, source,
                            stem.with_suffix('.mp4'), stem.with_suffix('.jpg'),
                            stem.with_name(stem.name + '-end.jpg'), args.poses/species], check=True)
            print(stem.name, flush=True)
