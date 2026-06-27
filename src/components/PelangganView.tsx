<div className="space-y-3">
        {displayMembers.map((member) => (
          <div key={member.id} className="p-4 border rounded shadow flex justify-between items-center">
            <div>
              <p className="font-bold">{member.name}</p>
              <p className="text-sm text-gray-500">{member.phone}</p>
            </div>

            {/* Bagian Tombol Aksi */}
            <div className="flex gap-2 items-center">
              {/* Tombol Remote Router (IP) */}
              {member.routerIp && (
                <button 
                  onClick={() => window.open(http://${member.routerIp}, '_blank')}
                  className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded border border-blue-200 font-bold"
                >
                  {member.routerIp}
                </button>
              )}
              
              {/* Tombol Edit */}
              <button className="text-blue-500 p-1">
                <Edit2 size={20} />
              </button>
              
              {/* Tombol Hapus */}
              <button onClick={() => onDeleteMember(member.id)} className="text-red-500 p-1">
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
