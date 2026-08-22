import { useState } from "react";
import Alert from "./components/common/Alert";
import Badge from "./components/common/Badge";
import Button from "./components/common/Button";
import EmptyState from "./components/common/EmptyState";
import Input from "./components/common/Input";
import Modal from "./components/common/Modal";
import Pagination from "./components/common/Pagination";
import Select from "./components/common/Select";
import Skeleton from "./components/common/Skeleton";
import Spinner from "./components/common/Spinner";
import Textarea from "./components/common/Textarea";

function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-10">
        <header>
          <h1 className="text-2xl font-bold text-slate-900">
            Helpdesk Design System
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Temporary component playground
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Buttons
          </h2>

          <div className="flex flex-wrap gap-3">
            <Button>Primary</Button>

            <Button variant="secondary">
              Secondary
            </Button>

            <Button variant="danger">
              Danger
            </Button>

            <Button variant="outline">
              Outline
            </Button>

            <Button loading>
              Loading
            </Button>

            <Button size="sm">
              Small
            </Button>

            <Button size="lg">
              Large
            </Button>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Form Controls
            </h2>

            <Input
              id="subject"
              label="Subject"
              placeholder="Enter ticket subject"
            />

            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              error="Please enter a valid email address."
            />

            <Select id="priority" label="Priority" defaultValue="medium">
              <option value="">Select priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>

            <Textarea
              id="description"
              label="Description"
              placeholder="Describe your issue..."
              rows={4}
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Alerts
            </h2>

            <Alert variant="success" title="Success">
              The ticket was created successfully.
            </Alert>

            <Alert variant="info" title="Information">
              Your ticket is currently being reviewed.
            </Alert>

            <Alert variant="warning" title="Warning">
              This ticket is approaching its SLA deadline.
            </Alert>

            <Alert variant="error" title="Error">
              Something went wrong while processing the request.
            </Alert>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Badges
          </h2>

          <div className="flex flex-wrap gap-2">
            <Badge variant="open">Open</Badge>
            <Badge variant="assigned">Assigned</Badge>
            <Badge variant="in_progress">In Progress</Badge>
            <Badge variant="resolved">Resolved</Badge>
            <Badge variant="closed">Closed</Badge>

            <Badge variant="low">Low</Badge>
            <Badge variant="medium">Medium</Badge>
            <Badge variant="high">High</Badge>
            <Badge variant="urgent">Urgent</Badge>

            <Badge variant="breach">SLA Breach</Badge>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Loading
          </h2>

          <div className="flex items-center gap-6">
            <Spinner size="sm" />
            <Spinner />
            <Spinner size="lg" />
          </div>

          <div className="max-w-xl space-y-3">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Empty State
          </h2>

          <EmptyState
            title="No tickets found"
            description="There are currently no tickets matching your filters."
            action={
              <Button size="sm">
                Create Ticket
              </Button>
            }
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Pagination
          </h2>

          <Pagination
            page={page}
            totalPages={5}
            total={47}
            limit={10}
            onPageChange={setPage}
            onLimitChange={() => setPage(1)}
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Modal
          </h2>

          <Button onClick={() => setModalOpen(true)}>
            Open Modal
          </Button>

          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Example Modal"
            footer={
              <>
                <Button
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>

                <Button onClick={() => setModalOpen(false)}>
                  Confirm
                </Button>
              </>
            }
          >
            <p className="text-sm text-slate-600">
              This is a temporary preview of the reusable modal
              component.
            </p>
          </Modal>
        </section>
      </div>
    </main>
  );
}

export default App;