export default function LoadingSpinner({ text = 'Chargement…' }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 gap-3">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  )
}