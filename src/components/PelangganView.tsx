import React, { useState } from "react";
import { Member, WifiPackage } from "../types";
import { formatRupiah } from "../utils";
import { Trash2, Edit2 } from "lucide-react";

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
  onDeleteMember 
}) => {
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Daftar Pelanggan</h1>
        <button onClick={onBack} className="bg-gray-500 text-white px-4 py-2 rounded">Kembali</button>
      </div>

      <div className="space-y-2">
        {members.map((member) => (
          <div key={member.id} className="p-4 border rounded shadow flex justify-between items-center">
            <div>
              <p className="font-bold">{member.name}</p>
              <p className="text-sm text-gray-600">{member.phone}</p>
            </div>
            <button onClick={() => onDeleteMember(member.id)} className="text-red-500">
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
