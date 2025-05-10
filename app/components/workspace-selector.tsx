// app/components/WorkspaceSelector.tsx (Exemplo)
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { createWorkspaceAction } from '../actions/workspace-actions';
import { Button } from './ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { PiggyBank, PlusCircle } from 'lucide-react';
import { Separator } from './ui/separator';

interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  members: string[];
  type: string;
  createdAt: string; 
  updatedAt: string; 
}

export default function WorkspaceSelector() {
  const { data: session, status } = useSession();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  const fetchWorkspaces = async () => {
    if (status !== 'authenticated') return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/workspaces');
      if (!res.ok) {
        throw new Error(`Erro ao buscar workspaces: ${res.statusText}`);
      }
      const data: Workspace[] = await res.json();
      setWorkspaces(data);
      // Opcional: selecionar o primeiro workspace automaticamente se houver
      if (data.length > 0 && !activeWorkspaceId) {
          setActiveWorkspaceId(data[0].id);
      }
    } catch (err: any) {
      console.error('Erro ao buscar workspaces:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchWorkspaces();
    }
  }, [status]);

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      alert('Por favor, insira um nome para o workspace.');
      return;
    }

    setIsCreating(true);
    setError(null); 

    const formData = new FormData();
    formData.append('name', newWorkspaceName);

    try {
      const result = await createWorkspaceAction(formData);

      if (!result.success) {
         throw new Error(result.message || 'Erro desconhecido ao criar workspace');
      }

      console.log('Workspace criado:', result.workspaceId);

      setNewWorkspaceName('');
      fetchWorkspaces();

    } catch (err: any) {
      console.error('Erro ao criar workspace:', err);
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  // Se estiver carregando a sessão ou os workspaces
  if (status === 'loading' || isLoading) {
    return <div>Carregando workspaces...</div>;
  }

  // Se não estiver autenticado, talvez redirecionar ou mostrar mensagem
  if (status === 'unauthenticated') {
      // Redirecionar para página de login ou mostrar um botão de login
      return <div>Por favor, faça login para gerenciar seus workspaces.</div>;
  }

  // Se houver erro ao carregar workspaces
  if (error) {
      return <div>Erro: {error} <Button onClick={fetchWorkspaces}>Tentar Novamente</Button></div>;
  }

  return (
    <Dialog>
      <DropdownMenu>
        <DropdownMenuTrigger>{workspaces.find((wsp) => wsp.id === activeWorkspaceId)?.name ?? 'Selecione um Workspace'}</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {workspaces.length > 0 ? (
            <ul className="space-y-2">
              {workspaces.map((workspace) => (
                <li key={workspace.id}>
                  <DropdownMenuItem
                    className="w-full justify-start"
                    onClick={() => setActiveWorkspaceId(workspace.id)}
                  >
                    <PiggyBank />
                    {workspace.name} 
                  </DropdownMenuItem>
                </li>
              ))}
            </ul>
          ) : (
            <p>Você ainda não tem workspaces. Crie um para começar!</p>
          )}
          <DropdownMenuSeparator />
          <DialogTrigger asChild>
            <DropdownMenuItem>
              <PlusCircle />
              Criar Novo Workspace
            </DropdownMenuItem>
          </DialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Novo Workspace</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            id="workspaceName"
            placeholder="Nome do Workspace"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          {/* O botão agora chama a função handleCreateWorkspace */}
          <Button onClick={handleCreateWorkspace} disabled={isCreating}>
            {isCreating ? 'Criando...' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
