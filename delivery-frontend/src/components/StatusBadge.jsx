const styles = {
  pending:            'bg-gray-100 text-gray-700',
  pending_acceptance: 'bg-orange-100 text-orange-700',
  in_progress:        'bg-blue-100 text-blue-700',
  delivered:          'bg-green-100 text-green-700',
  failed:             'bg-red-100 text-red-700',
  planned:            'bg-purple-100 text-purple-700',
  done:               'bg-teal-100 text-teal-700',
  active:             'bg-green-100 text-green-700',
  inactive:           'bg-gray-100 text-gray-500',
}

const labels = {
  pending:            'En attente',
  pending_acceptance: 'Cherche livreur',
  in_progress:        'En cours',
  delivered:          'Livré',
  failed:             'Échec',
  planned:            'Planifié',
  done:               'Terminé',
  active:             'Actif',
  inactive:           'Inactif',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {labels[status] || status}
    </span>
  )
}