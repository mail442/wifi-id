<div className="space-y-3">
        {displayMembers.length > 0 ? (
          displayMembers.map((member) => (
            <div key={member.id} className="p-4 border rounded shadow flex justify-between items-center">
              <div>
                <p className="font-bold flex items-center gap-2">
                  {member.name}
                  {/* Menampilkan IP Router di sebelah nama */}
                  {member.routerIp && (
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                      {member.routerIp}
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-500">{member.phone}</p>
              </div>
              <button onClick={() => onDeleteMember(member.id)} className="text-red-500">
                <Trash2 size={20} />
              </button>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">Tidak ada pelanggan ditemukan.</p>
        )}
      </div>
