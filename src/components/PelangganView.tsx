import React, { useState } from "react";
import { Member, WifiPackage } from "../types";
import { formatRupiah } from "../utils";

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
  onAddMember, 
  onEditMember, 
  onDeleteMember 
}) => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Daftar Pelanggan</h1>
      <button onClick={onBack} className="mt-4 bg-gray-500 text-white p-2 rounded">
        Kembali
      </button>
    </div>
  );
};
