import { useStore } from '../../store/store'
import { ALL_SHAPE_TYPES, SHAPE_LABELS } from '../../data/shapes'
import type { ShapeType } from '../../types'

interface Props {
  onAddCustom: () => void
}

// Mini SVG icon for each shape type
function ShapeIcon({ type }: { type: ShapeType }) {
  const S = 28
  const fill = '#60a5fa'
  const stroke = '#2563eb'
  switch (type) {
    case 'rectangle': return <svg width={S} height={S/2}><rect x={0} y={0} width={S} height={S/2} fill={fill} stroke={stroke} strokeWidth={1}/></svg>
    case 'square': return <svg width={S} height={S}><rect x={0} y={0} width={S} height={S} fill={fill} stroke={stroke} strokeWidth={1}/></svg>
    case 'circle': return <svg width={S} height={S}><circle cx={S/2} cy={S/2} r={S/2-1} fill={fill} stroke={stroke} strokeWidth={1}/></svg>
    case 'ellipse': return <svg width={S} height={S*0.6}><ellipse cx={S/2} cy={S*0.3} rx={S/2-1} ry={S*0.3-1} fill={fill} stroke={stroke} strokeWidth={1}/></svg>
    case 'semicircle': return <svg width={S} height={S/2}><path d={`M 0,${S/2} A ${S/2},${S/2} 0 0,1 ${S},${S/2} Z`} fill={fill} stroke={stroke} strokeWidth={1}/></svg>
    case 'quadrant': return <svg width={S} height={S}><path d={`M 0,0 L ${S},0 A ${S},${S} 0 0,1 0,${S} Z`} fill={fill} stroke={stroke} strokeWidth={1}/></svg>
    case 'triangle': return <svg width={S} height={S}><polygon points={`${S/2},0 ${S},${S} 0,${S}`} fill={fill} stroke={stroke} strokeWidth={1}/></svg>
    case 'right-triangle': return <svg width={S} height={S}><polygon points={`0,0 ${S},${S} 0,${S}`} fill={fill} stroke={stroke} strokeWidth={1}/></svg>
    case 'wall': return <svg width={S} height={8}><line x1={0} y1={4} x2={S} y2={4} stroke={stroke} strokeWidth={4} strokeLinecap="round"/></svg>
    case 'L-shape': {
      const t = S/3
      return <svg width={S} height={S}><polygon points={`0,0 ${t},0 ${t},${S-t} ${S},${S-t} ${S},${S} 0,${S}`} fill={fill} stroke={stroke} strokeWidth={1}/></svg>
    }
    case 'U-shape': {
      const t = S/4
      return <svg width={S} height={S}><polygon points={`0,0 ${t},0 ${t},${S-t} ${S-t},${S-t} ${S-t},0 ${S},0 ${S},${S} 0,${S}`} fill={fill} stroke={stroke} strokeWidth={1}/></svg>
    }
    case 'pentagon': {
      const pts = Array.from({length:5},(_,i)=>{const a=(2*Math.PI*i/5)-Math.PI/2;return `${S/2+S/2*Math.cos(a)},${S/2+S/2*Math.sin(a)}`}).join(' ')
      return <svg width={S} height={S}><polygon points={pts} fill={fill} stroke={stroke} strokeWidth={1}/></svg>
    }
    case 'hexagon': {
      const pts = Array.from({length:6},(_,i)=>{const a=2*Math.PI*i/6;return `${S/2+S/2*Math.cos(a)},${S/2+S/2*Math.sin(a)}`}).join(' ')
      return <svg width={S} height={S}><polygon points={pts} fill={fill} stroke={stroke} strokeWidth={1}/></svg>
    }
    case 'octagon': {
      const pts = Array.from({length:8},(_,i)=>{const a=(2*Math.PI*i/8)-Math.PI/8;return `${S/2+S/2*Math.cos(a)},${S/2+S/2*Math.sin(a)}`}).join(' ')
      return <svg width={S} height={S}><polygon points={pts} fill={fill} stroke={stroke} strokeWidth={1}/></svg>
    }
    default:
      return <svg width={28} height={28}><rect x={2} y={2} width={24} height={24} fill={fill} stroke={stroke} strokeWidth={1}/></svg>
  }
}

export function ShapePalette({ onAddCustom }: Props) {
  const addObject = useStore(s => s.addObject)

  return (
    <div className="p-2">
      <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-2 px-1">Shapes</p>
      <div className="grid grid-cols-2 gap-1">
        {ALL_SHAPE_TYPES.map(type => (
          <button
            key={type}
            onClick={() => addObject(type)}
            title={SHAPE_LABELS[type]}
            className="flex flex-col items-center gap-1 px-1 py-2 rounded hover:bg-surface-raised transition-colors text-text-muted hover:text-text-primary"
          >
            <ShapeIcon type={type} />
            <span className="text-xs leading-tight text-center">{SHAPE_LABELS[type]}</span>
          </button>
        ))}
        <button
          onClick={onAddCustom}
          className="flex flex-col items-center gap-1 px-1 py-2 rounded hover:bg-surface-raised transition-colors text-text-muted hover:text-text-primary col-span-2"
        >
          <span className="text-xl">+</span>
          <span className="text-xs">Custom…</span>
        </button>
      </div>
    </div>
  )
}
