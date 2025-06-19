import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/notebook/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/notebook/$id"!</div>
}
