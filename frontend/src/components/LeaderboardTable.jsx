import React from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'

const medals = ['🥇', '🥈', '🥉']

export default function LeaderboardTable({ entries = [] }) {
  const { user } = useAuth()
  const maxPoints = entries[0]?.civic_points || 1

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
        <h2 className="text-white font-bold text-lg">🏆 Civic Champions</h2>
      </div>
      <div className="divide-y divide-gray-100">
        {entries.map((entry, i) => {
          const isMe = entry._id === user?._id || entry.id === user?.id
          return (
            <div key={entry._id || i}
              className={`flex items-center gap-4 px-6 py-3 ${isMe ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''}`}>
              <span className="text-xl w-8 text-center">
                {i < 3 ? medals[i] : <span className="text-gray-500 font-semibold text-sm">#{i + 1}</span>}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm truncate ${isMe ? 'text-indigo-700' : 'text-gray-800'}`}>
                  {entry.name} {isMe && <span className="text-xs font-normal">(You)</span>}
                </p>
                <div className="mt-1 bg-gray-100 rounded-full h-1.5 w-full">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${(entry.civic_points / maxPoints) * 100}%` }}
                  />
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold text-indigo-600">{entry.civic_points}</span>
                <p className="text-xs text-gray-400">points</p>
              </div>
            </div>
          )
        })}
        {!entries.length && (
          <div className="text-center py-8 text-gray-400">No entries yet.</div>
        )}
      </div>
    </div>
  )
}
