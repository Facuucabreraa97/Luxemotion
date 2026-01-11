import React from 'react';
import { Download } from 'lucide-react';
import { S } from '../styles';

export const GalleryPage = ({ videos }: any) => (
  <div className="p-6 lg:p-12 pb-32 animate-in fade-in">
    <h2 className="text-4xl font-bold uppercase tracking-[0.2em] mb-12 border-b border-white/10 pb-8 text-white">Portfolio</h2>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        {videos.map((v:any) => (
            <div key={v.id} className={`rounded-[30px] overflow-hidden group relative ${S.panel} hover:-translate-y-2`}>
                <video src={v.url} className="aspect-[9/16] object-cover w-full" controls/>
                <div className="p-5 bg-[#0a0a0a] flex justify-between items-center"><span className="text-[9px] text-white/40 font-bold uppercase tracking-widest">{v.date}</span><a href={v.url} download className="bg-white/5 p-2 rounded-full text-[#C6A649] hover:bg-[#C6A649] hover:text-black transition-all"><Download size={14}/></a></div>
            </div>
        ))}
        {videos.length===0 && <div className="col-span-full text-center py-32 text-white/20 uppercase text-xs tracking-[0.4em]">Sin producciones aún</div>}
    </div>
  </div>
);
