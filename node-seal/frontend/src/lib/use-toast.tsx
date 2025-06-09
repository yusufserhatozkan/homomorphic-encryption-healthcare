interface ToastProps {
  title: string
  description: string
}

export const toast = ({ title, description }: ToastProps) => {
  // In a real implementation, this would show a toast notification
  console.log(`Toast: ${title} - ${description}`)

  // For demo purposes, we'll use an alert
  alert(`${title}: ${description}`)
}
