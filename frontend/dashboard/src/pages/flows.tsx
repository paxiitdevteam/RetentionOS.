/**
 * Flows Page
 * List and manage retention flows
 */

import { NextPage } from 'next';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';
import { LoadingState, Alert, EmptyState, Button } from '../components/ui';

interface Flow {
  id: number;
  name: string;
  steps: any[];
  language: string;
  rankingScore: number;
  createdAt: string;
  updatedAt: string;
}

const Flows: NextPage = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadFlows();
    }
  }, [isAuthenticated]);

  const loadFlows = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getFlows();
      if (response.success) {
        setFlows(response.flows);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load flows');
      console.error('Error loading flows:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this flow?')) {
      return;
    }

    try {
      await apiClient.deleteFlow(id);
      await loadFlows();
    } catch (err: any) {
      alert(err.message || 'Failed to delete flow');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <Head>
        <title>Flows - RetentionOS Dashboard</title>
        <meta name="description" content="RetentionOS Flow Management" />
      </Head>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#003A78', margin: 0 }}>
            Retention Flows
          </h1>
          <Button onClick={() => router.push('/flows/builder?id=new')}>
            + Create Flow
          </Button>
        </div>

        {loading && <LoadingState message="Loading flows..." />}

        {error && (
          <div style={{ marginBottom: '24px' }}>
            <Alert type="error" title="Error loading flows">
              {error}
            </Alert>
          </div>
        )}

        {!loading && !error && (
          <>
            {flows.length === 0 ? (
              <EmptyState
                icon="🔄"
                title="No flows created yet"
                description="Create your first retention flow to start saving customers"
                action={
                  <Button onClick={() => router.push('/flows/builder?id=new')}>
                    Create Your First Flow
                  </Button>
                }
              />
            ) : (
              <div style={{ display: 'grid', gap: '20px' }}>
                {flows.map((flow) => (
                  <Card key={flow.id} padding="lg">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#003A78', margin: '0 0 8px 0' }}>
                          {flow.name}
                        </h3>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          Language: {flow.language} • Steps: {flow.steps.length} • Ranking: {flow.rankingScore}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/flows/builder?id=${flow.id}`)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(flow.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>

                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Flow Steps:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {flow.steps.map((step: any, index: number) => (
                          <span
                            key={index}
                            style={{
                              padding: '4px 12px',
                              background: '#f0f4f8',
                              color: '#003A78',
                              borderRadius: '4px',
                              fontSize: '12px',
                              textTransform: 'capitalize',
                            }}
                          >
                            {step.type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Flows;

