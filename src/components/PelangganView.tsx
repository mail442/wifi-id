import React, { useState } from "react";
import { Member, WifiPackage } from "../types";
import { Trash2, Plus, X } from "lucide-react";

interface PelangganViewProps {
  members: Member[];
  packages: WifiPackage[];
  onBack: () => void;
  onAddMember: (name: string, phone: string, packageId: string, dueDateDay: number, routerIp: string) => void;
  onDeleteMember: (memberId: string) => void;
}

export const PelangganView: React.FC<PelangganViewProps> = ({ 
  members, packages, onBack, onAddMember, onDeleteMember 
}) => {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [packageId, setPackageId] = useState(packages[0]?.id || "");
  const [dueDate, setDueDate] = useState("1");
  const [ip, setIp] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddMember(name, phone, packageId, parseInt(dueDate), ip);
    setShowForm(false);
    setName(""); setPhone(""); setIp("");
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Daftar Pelanggan</h1>
        <button onClick={onBack} className="bg-gray-200 px-3 py-1 rounded">Kembali</button>
      </div>

      <button onClick={() => setShowForm(true)} className="w-full bg-blue-600 text-white p-2 rounded mb-4 flex justify-center items-center gap-2">
        <Plus size={20} /> Tambah Pelanggan
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded border mb-4 space-y-2">
          <input type="text" placeholder="Nama" className="w-full p-2 border rounded" value={name} onChange={(e) => setName(e.target.value)} required />
          <input type="text" placeholder="No HP" className="w-full p-2 border rounded" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <select className="w-full p-2 border rounded" value={packageId} onChange={(e) => setPackageId(e.target.value)}>
            {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input type="text" placeholder="Router IP" className="w-full p-2 border rounded" value={ip} onChange={(e) => setIp(e.target.value)} />
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-green-600 text-white p-2 rounded">Simpan</button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-red-500 text-white p-2 rounded"><X /></button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {members.map((member) => (
          <div key={member.id} className="p-4 border rounded shadow flex justify-between items-center">
            <div>
              <p className="font-bold">{member.name}</p>
              <p className="text-sm text-gray-500">{member.phone}</p>
            </div>
            <button onClick={() => onDeleteMember(member.id)} className="text-red-500"><Trash2 size={20} /></button>
          </div>
        ))}
      </div>
    </div>
  );
};
