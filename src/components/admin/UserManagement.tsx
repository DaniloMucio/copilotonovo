'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from '@/components/ui/dialog';
import { AdminEditUserForm } from '@/components/forms/AdminEditUserForm';
import { updateUserByAdmin, deleteUserByAdmin } from '@/services/admin';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Users, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX,
  Mail,
  Phone,
  Calendar,
  Settings,
  AlertTriangle,
  AlertCircle,
  X
} from 'lucide-react';
import { getAllUsersWithStats, type UserWithStats } from '@/services/admin';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserManagementProps {
  onUserSelect?: (user: UserWithStats) => void;
}

export function UserManagement({ onUserSelect }: UserManagementProps) {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [editingUser, setEditingUser] = useState<UserWithStats | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithStats | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Filtros avançados
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Seleção múltipla
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const usersData = await getAllUsersWithStats();
        setUsers(usersData);
        setFilteredUsers(usersData);
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar usuários',
          description: 'Não foi possível carregar a lista de usuários. Tente novamente.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [toast]);

  useEffect(() => {
    let filtered = users.filter(user => {
      // Filtro de busca por texto
      const matchesSearch = user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.userType.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro por tipo de usuário
      const matchesUserType = userTypeFilter === 'all' || user.userType === userTypeFilter;
      
      // Filtro por status
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && (user.isActive || user.isOnline)) ||
                           (statusFilter === 'inactive' && (!user.isActive && !user.isOnline));
      
      return matchesSearch && matchesUserType && matchesStatus;
    });

    // Ordenação
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.displayName.toLowerCase();
          bValue = b.displayName.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'type':
          aValue = a.userType;
          bValue = b.userType;
          break;
        case 'deliveries':
          aValue = a.totalDeliveries || 0;
          bValue = b.totalDeliveries || 0;
          break;
        case 'revenue':
          aValue = a.totalRevenue || 0;
          bValue = b.totalRevenue || 0;
          break;
        case 'lastActivity':
          aValue = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
          bValue = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
          break;
        default:
          aValue = a.displayName.toLowerCase();
          bValue = b.displayName.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredUsers(filtered);
  }, [searchTerm, users, userTypeFilter, statusFilter, sortBy, sortOrder]);

  const handleUserClick = (user: UserWithStats) => {
    setSelectedUser(user);
    onUserSelect?.(user);
  };

  const handleUserUpdated = async () => {
    try {
      const usersData = await getAllUsersWithStats();
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      console.error('Erro ao recarregar usuários:', error);
    }
  };

  const handleCloseEditDialog = () => {
    setShowEditDialog(false);
    setEditingUser(null);
  };

  const handleDeleteUser = (user: UserWithStats) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      console.log(`🗑️ ADMIN: Iniciando exclusão completa do usuário ${userToDelete.uid}`);
      
      // EXCLUSÃO COMPLETA - Remove TODOS os dados relacionados
      const deletionResult = await deleteUserByAdmin(userToDelete.uid, userToDelete.userType);
      
      if (deletionResult.success) {
        console.log(`✅ ADMIN: Usuário excluído completamente - ${deletionResult.deletedCount} documentos removidos`);
        
        // Remover usuário da lista local
        const updatedUsers = users.filter(user => user.uid !== userToDelete.uid);
        setUsers(updatedUsers);
        setFilteredUsers(updatedUsers);

        toast({
          title: 'Usuário excluído completamente',
          description: `Usuário excluído com sucesso. ${deletionResult.deletedCount} documentos foram removidos permanentemente. ${deletionResult.firebaseAuthDeleted ? 'Conta do Firebase Auth também foi deletada.' : 'Conta do Firebase Auth não foi deletada, mas o usuário não conseguirá mais fazer login.'}`,
        });
      } else {
        console.warn(`⚠️ ADMIN: Exclusão parcial - ${deletionResult.errors.length} erros encontrados`);
        
        toast({
          variant: 'destructive',
          title: 'Exclusão parcial',
          description: `Usuário excluído parcialmente. ${deletionResult.deletedCount} documentos removidos, mas alguns dados podem ter permanecido.`,
        });
      }

      setShowDeleteDialog(false);
      setUserToDelete(null);
      setSelectedUser(null);
      
    } catch (error) {
      console.error('❌ ADMIN: Erro crítico ao excluir usuário:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir usuário',
        description: 'Não foi possível excluir o usuário. Tente novamente.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteUser = () => {
    setShowDeleteDialog(false);
    setUserToDelete(null);
  };

  const handleToggleUserStatus = async (user: UserWithStats) => {
    try {
      const updateData = user.userType === 'motorista' 
        ? { isOnline: !user.isOnline }
        : { isActive: !user.isActive };

      await updateUserByAdmin(user.uid, updateData);

      // Atualizar lista local
      const updatedUsers = users.map(u => 
        u.uid === user.uid 
          ? { ...u, ...updateData }
          : u
      );
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);

      toast({
        title: 'Status atualizado',
        description: `Usuário ${user.userType === 'motorista' ? (user.isOnline ? 'desativado' : 'ativado') : (user.isActive ? 'desativado' : 'ativado')} com sucesso.`,
      });

    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao alterar status',
        description: 'Não foi possível alterar o status do usuário. Tente novamente.',
      });
    }
  };

  // Funções para seleção múltipla
  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.uid)));
    }
  };

  const handleBulkToggleStatus = async (action: 'activate' | 'deactivate') => {
    if (selectedUsers.size === 0) return;

    setIsBulkActionLoading(true);
    try {
      const promises = Array.from(selectedUsers).map(async (userId) => {
        const user = users.find(u => u.uid === userId);
        if (!user) return;

        const updateData = user.userType === 'motorista' 
          ? { isOnline: action === 'activate' }
          : { isActive: action === 'activate' };

        return updateUserByAdmin(userId, updateData);
      });

      await Promise.all(promises);

      // Atualizar lista local
      const updatedUsers = users.map(u => {
        if (selectedUsers.has(u.uid)) {
          return {
            ...u,
            ...(u.userType === 'motorista' 
              ? { isOnline: action === 'activate' }
              : { isActive: action === 'activate' }
            )
          };
        }
        return u;
      });
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);

      toast({
        title: 'Ação em lote concluída',
        description: `${selectedUsers.size} usuários ${action === 'activate' ? 'ativados' : 'desativados'} com sucesso.`,
      });

      setSelectedUsers(new Set());

    } catch (error) {
      console.error('Erro na ação em lote:', error);
      toast({
        variant: 'destructive',
        title: 'Erro na ação em lote',
        description: 'Não foi possível executar a ação em lote. Tente novamente.',
      });
    } finally {
      setIsBulkActionLoading(false);
    }
  };


  const getStatusBadge = (user: UserWithStats) => {
    if (user.userType === 'motorista') {
      return (
        <Badge variant={user.isOnline ? "default" : "secondary"}>
          {user.isOnline ? "Online" : "Offline"}
        </Badge>
      );
    }
    return (
      <Badge variant={user.isActive ? "default" : "secondary"}>
        {user.isActive ? "Ativo" : "Inativo"}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <CardHeader className="relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg animate-pulse"></div>
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-3 bg-white/50 backdrop-blur-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <Users className="h-4 w-4 text-white" />
            </div>
            Gestão de Usuários
          </CardTitle>
          <CardDescription className="text-gray-600">
            Gerencie todos os usuários do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          {/* Filtros avançados */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-300 text-gray-900 hover:bg-gray-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
              />
            </div>

            <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
              <SelectTrigger className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent className="bg-white border-0 shadow-2xl rounded-2xl">
                <SelectItem value="all" className="text-gray-900 hover:bg-gray-50">Todos os tipos</SelectItem>
                <SelectItem value="motorista" className="text-gray-900 hover:bg-gray-50">Motoristas</SelectItem>
                <SelectItem value="cliente" className="text-gray-900 hover:bg-gray-50">Clientes</SelectItem>
                <SelectItem value="admin" className="text-gray-900 hover:bg-gray-50">Administradores</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-0 shadow-2xl rounded-2xl">
                <SelectItem value="all" className="text-gray-900 hover:bg-gray-50">Todos os status</SelectItem>
                <SelectItem value="active" className="text-gray-900 hover:bg-gray-50">Ativos</SelectItem>
                <SelectItem value="inactive" className="text-gray-900 hover:bg-gray-50">Inativos</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent className="bg-white border-0 shadow-2xl rounded-2xl">
                  <SelectItem value="name" className="text-gray-900 hover:bg-gray-50">Nome</SelectItem>
                  <SelectItem value="email" className="text-gray-900 hover:bg-gray-50">Email</SelectItem>
                  <SelectItem value="type" className="text-gray-900 hover:bg-gray-50">Tipo</SelectItem>
                  <SelectItem value="deliveries" className="text-gray-900 hover:bg-gray-50">Entregas</SelectItem>
                  <SelectItem value="revenue" className="text-gray-900 hover:bg-gray-50">Receita</SelectItem>
                  <SelectItem value="lastActivity" className="text-gray-900 hover:bg-gray-50">Última atividade</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>

          {/* Controles de seleção múltipla */}
          {selectedUsers.size > 0 && (
            <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-blue-600">
                  {selectedUsers.size} selecionados
                </Badge>
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Ações em lote disponíveis:
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkToggleStatus('activate')}
                  disabled={isBulkActionLoading}
                  className="bg-green-600 text-white hover:bg-green-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Ativar Selecionados
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkToggleStatus('deactivate')}
                  disabled={isBulkActionLoading}
                  className="bg-red-600 text-white hover:bg-red-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Desativar Selecionados
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedUsers(new Set())}
                  className="bg-gray-600 text-white hover:bg-gray-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar Seleção
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {filteredUsers.length} usuários
              </Badge>
              {selectedUsers.size > 0 && (
                <Badge variant="secondary">
                  {selectedUsers.size} selecionados
                </Badge>
              )}
            </div>
            
          </div>

          {/* Lista de usuários */}
          <div className="space-y-3">
            {/* Cabeçalho com seleção múltipla */}
            <div className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500 p-4">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-900">Selecionar todos</span>
                </div>
                <div className="text-sm text-gray-600">
                  {filteredUsers.length} usuários encontrados
                </div>
              </div>
            </div>

            {filteredUsers.map((user) => (
              <div
                key={user.uid}
                className={`shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500 p-4 ${
                  selectedUsers.has(user.uid) ? 'ring-2 ring-blue-500 shadow-xl' : ''
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Checkbox de seleção */}
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user.uid)}
                    onChange={() => handleSelectUser(user.uid)}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded border-gray-300"
                  />
                  
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{user.displayName}</p>
                      <Badge variant="outline" className="capitalize bg-gradient-to-r from-blue-600/10 to-purple-600/10 text-blue-600 border-0 rounded-full shadow-sm">
                        {user.userType}
                      </Badge>
                      {getStatusBadge(user)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                        {user.needsAuthSetup && (
                          <Badge variant="outline" className="ml-2 text-xs bg-yellow-100 text-yellow-600 border-0 rounded-full shadow-sm">
                            Precisa configurar login
                          </Badge>
                        )}
                      </span>
                      {user.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {user.phone}
                        </span>
                      )}
                      {user.lastActivity && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(user.lastActivity, 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="text-right text-sm">
                    <p className="text-gray-900 font-medium">{user.totalDeliveries || 0} entregas</p>
                    <p className="text-gray-600">
                      R$ {(user.totalRevenue || 0).toFixed(2)}
                    </p>
                  </div>
                  
                  {/* Ações rápidas */}
                  <div className="flex items-center gap-1">
                    {/* Toggle Status Online/Ativo */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleUserStatus(user);
                      }}
                      className={`rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ${
                        user.userType === 'motorista' 
                          ? (user.isOnline ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-600 text-white hover:bg-gray-700")
                          : (user.isActive ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-600 text-white hover:bg-gray-700")
                      }`}
                      title={user.userType === 'motorista' 
                        ? (user.isOnline ? "Motorista online - Clique para desativar" : "Motorista offline - Clique para ativar")
                        : (user.isActive ? "Usuário ativo - Clique para desativar" : "Usuário inativo - Clique para ativar")
                      }
                    >
                      {user.userType === 'motorista' 
                        ? (user.isOnline ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />)
                        : (user.isActive ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />)
                      }
                    </Button>

                    {/* Editar */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingUser(user);
                        setShowEditDialog(true);
                      }}
                      className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                      title="Editar usuário"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    {/* Ver detalhes */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUserClick(user);
                      }}
                      title="Ver detalhes"
                      className="bg-green-600 text-white hover:bg-green-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {/* Excluir */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteUser(user);
                      }}
                      className="bg-red-600 text-white hover:bg-red-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                      title="Excluir usuário"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                <Users className="h-8 w-8 text-white" />
              </div>
              <p className="text-lg font-medium text-gray-900">Nenhum usuário encontrado</p>
              <p className="text-sm text-gray-600">Tente ajustar os filtros de busca</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalhes do usuário */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl" aria-describedby="user-details-description">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
            <DialogDescription id="user-details-description">
              Visualize as informações completas do usuário selecionado
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nome</label>
                  <p className="text-lg">{selectedUser.displayName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-lg">{selectedUser.email}</p>
                  {selectedUser.needsAuthSetup && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        Precisa configurar login
                      </Badge>
                      {selectedUser.tempPassword && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Senha temporária: {selectedUser.tempPassword}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                  <Badge variant="outline" className="capitalize">
                    {selectedUser.userType}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  {getStatusBadge(selectedUser)}
                </div>
                {selectedUser.phone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                    <p className="text-lg">{selectedUser.phone}</p>
                  </div>
                )}
                {selectedUser.companyName && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Empresa</label>
                    <p className="text-lg">{selectedUser.companyName}</p>
                  </div>
                )}
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Estatísticas</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Total de Entregas</label>
                    <p className="text-lg font-semibold">{selectedUser.totalDeliveries || 0}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Receita Total</label>
                    <p className="text-lg font-semibold text-green-600">
                      R$ {(selectedUser.totalRevenue || 0).toFixed(2)}
                    </p>
                  </div>
                  {selectedUser.lastActivity && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Última Atividade</label>
                      <p className="text-lg">
                        {format(selectedUser.lastActivity, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button 
                  variant="destructive" 
                  onClick={() => handleDeleteUser(selectedUser)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Usuário
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelectedUser(null)}>
                    Fechar
                  </Button>
                  <Button onClick={() => {
                    setEditingUser(selectedUser);
                    setShowEditDialog(true);
                    setSelectedUser(null);
                  }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Usuário
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de edição de usuário */}
      <Dialog open={showEditDialog} onOpenChange={handleCloseEditDialog}>
        <DialogContent className="max-w-2xl bg-white border-0 shadow-2xl rounded-2xl" aria-describedby="edit-user-description">
          <DialogHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 p-6 rounded-t-2xl">
            <DialogTitle className="text-gray-900">Editar Usuário</DialogTitle>
            <DialogDescription id="edit-user-description" className="text-gray-600">
              Modifique as informações do usuário selecionado
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <AdminEditUserForm
              user={editingUser as any}
              userData={editingUser}
              onFormSubmit={handleCloseEditDialog}
              onUserUpdated={handleUserUpdated}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white border-0 shadow-2xl rounded-2xl">
          <AlertDialogHeader className="bg-gradient-to-r from-red-600/5 to-red-500/5 p-6 rounded-t-2xl">
            <AlertDialogTitle className="flex items-center gap-2 text-gray-900">
              <Trash2 className="h-5 w-5 text-red-600" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              <div className="space-y-3">
                <div>
                  Tem certeza de que deseja excluir <strong>COMPLETAMENTE</strong> o usuário <strong>{userToDelete?.displayName}</strong>?
                </div>
                
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-200 font-semibold">
                    <AlertTriangle className="h-4 w-4" />
                    EXCLUSÃO COMPLETA E IRREVERSÍVEL
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    Esta ação removerá <strong>TODOS</strong> os dados relacionados ao usuário do sistema.
                    <br />
                    <strong>O usuário NÃO conseguirá mais fazer login no sistema.</strong>
                    <br />
                    <strong>A conta do Firebase Authentication também será deletada.</strong>
                  </p>
                </div>

                <div>
                  <strong>Dados que serão excluídos permanentemente:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li><strong>Perfil completo</strong> do usuário</li>
                    <li><strong>Todas as transações</strong> financeiras</li>
                    <li><strong>Todas as entregas</strong> (como cliente ou motorista)</li>
                    <li><strong>Agendamentos</strong> (se for cliente)</li>
                    <li><strong>Jornadas de trabalho</strong> (se for motorista)</li>
                    <li><strong>Veículos</strong> cadastrados (se for motorista)</li>
                    <li><strong>Notificações</strong> e configurações</li>
                    <li><strong>Histórico completo</strong> de atividades</li>
                  </ul>
                </div>

                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                  <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200 font-semibold">
                    <AlertCircle className="h-4 w-4" />
                    IMPORTANTE
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Após a exclusão, o email <strong>{userToDelete?.email}</strong> poderá ser reutilizado para criar uma nova conta.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDeleteUser} disabled={isDeleting} className="bg-gray-500 text-white hover:bg-gray-600 rounded-xl shadow-md">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg"
            >
              {isDeleting ? 'Excluindo...' : 'Sim, excluir usuário'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}