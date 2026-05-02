import React from 'react';
import { Icon } from '../shared/Icon';

interface PlaceholderScreenProps {
  name: string;
}

export const PlaceholderScreen = ({ name }: PlaceholderScreenProps) => (
  <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:10 }}>
    <Icon name="layers" size={36} color="var(--muted)"/>
    <div style={{ fontFamily:'var(--font-head)', fontSize:16, color:'var(--muted)' }}>{name}</div>
    <div style={{ fontSize:13, color:'var(--muted)', opacity:0.6 }}>Screen in progress</div>
  </div>
);
