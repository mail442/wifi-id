import React, { useState } from "react";
import { Member, WifiPackage } from "../types";
import { formatRupiah } from "../utils";
import { Trash2, Edit2, Search, Plus } from "lucide-react";

interface PelangganViewProps {
  members: Member[];
  packages: WifiPackage[];
  onBack: () => void;
  onAddMember: (name: string, phone: string, packageId: string, dueDateDay: number, routerIp: string) => void;
  onEditMember: (memberId: string, name: string, phone: string, packageId: string, dueDateDay: number, routerIp: string) => void;
  onDeleteMember: (memberId: string) => void;
}

export const PelangganView: React.FC<PelangganViewProps> = ({ 
  members, 
  packages, 
  onBack, 
  onDeleteMember,
  onEditMember
}) => {
  const [search, setSearch] = useState("");

  // Filter pelanggan berdasarkan pencarian
  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Daftar Pelanggan</h1>
        <button onClick={onBack} className="text-sm bg-gray-200 px-3 py-1 rounded">Kembali</button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Cari nama pelanggan..." 
          className="w-full pl-10 p-2 border rounded"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {filteredMembers.map((member) => {
          const pkg = packages.find(p => p.id === member.packageId);
          return (
            <div key={member.id} className="p-3 border rounded-lg flex justify-between items-center shadow-sm">
              <div>
                <p className="font-semibold text-gray-800">{member.name}</p>
                <p className="text-xs text-gray-500">{pkg?.name || "Paket tidak ditemukan"}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => console.log("Edit", member.id)} className="text-blue-500 p-1">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => onDeleteMember(member.id)} className="text-red-500 p-1">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
