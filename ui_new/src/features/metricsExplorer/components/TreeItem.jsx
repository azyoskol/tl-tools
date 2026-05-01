import React from 'react';
import { Icon } from '../../../components/shared/Icon';

export const TreeItem = ({ item, depth = 0, selected, onSelect, expandedGroups, toggleGroup }) => {
  const isGroup = !!item.children;
  const isExpanded = expandedGroups.includes(item.id);

  if (isGroup) {
    return (
      <div>
        <div onClick={() => toggleGroup(item.id)} style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '7px 10px',
          cursor: 'pointer', borderRadius: 6, color: 'var(--muted2)', fontSize: 12.5, fontWeight: 500,
        }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
           onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <Icon name={item.icon || 'layers'} size={13} color="var(--muted)" />
          <span style={{ flex: 1 }}>{item.label}</span>
          <div style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}>
            <Icon name="chevronDown" size={12} color="var(--muted)" />
          </div>
        </div>
        {isExpanded && item.children.map(child => (
          <TreeItem key={child.id} item={child} depth={depth+1} selected={selected}
            onSelect={onSelect} expandedGroups={expandedGroups} toggleGroup={toggleGroup} />
        ))}
      </div>
    );
  }

  return (
    <div onClick={() => onSelect(item.id)} style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px 6px 26px',
      cursor: 'pointer', borderRadius: 6, background: selected === item.id ? `${item.color}15` : 'transparent',
      color: selected === item.id ? item.color : 'var(--muted2)', fontSize: 12.5,
      borderLeft: selected === item.id ? `2px solid ${item.color}` : '2px solid transparent',
      marginLeft: 8,
    }} onMouseEnter={e => { if (selected !== item.id) e.currentTarget.style.color = 'var(--text)'; }}
       onMouseLeave={e => { if (selected !== item.id) e.currentTarget.style.color = 'var(--muted2)'; }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: item.color }} />
      <span style={{ flex: 1 }}>{item.label}</span>
      <span style={{ fontSize: 10, opacity: 0.5, fontFamily: 'var(--font-mono)' }}>{item.unit}</span>
    </div>
  );
};