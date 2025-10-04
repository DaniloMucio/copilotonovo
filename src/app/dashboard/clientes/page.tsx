'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  MapPin, 
  Phone, 
  Mail,
  Building,
  User,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { auth } from '@/lib/firebase';
import { getUserDocument, type UserData } from '@/services/firestore';
import { useToast } from '@/hooks/use-toast';
import { useDashboardRefresh } from '@/hooks/use-unified-refresh';
import { getAddressFromCEP } from '@/services/viacep';
import { 
  getRecipientsByUser, 
  createRecipient, 
  updateRecipient, 
  deleteRecipient,
  type Recipient 
} from '@/services/recipients';

// Schema de validação
const clientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  phone: z.string().optional(),
  address: z.object({
    street: z.string().min(1, 'Rua é obrigatória.'),
    number: z.string().min(1, 'Número é obrigatório.'),
    neighborhood: z.string().min(1, 'Bairro é obrigatório.'),
    city: z.string().min(1, 'Cidade é obrigatória.'),
    state: z.string().min(1, 'Estado é obrigatório.'),
    cep: z.string().min(1, 'CEP é obrigatório.'),
  }),
});

type ClientFormData = z.infer<typeof clientSchema>;

// Usar a interface Recipient do banco de dados
type Client = Recipient;


function ClientesPage() {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const { toast } = useToast();
  const { refreshDeliveries } = useDashboardRefresh();

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      phone: '',
      address: {
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        cep: ''
      }
    },
  });

  const loadClients = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      console.log('🔄 Carregando destinatários do banco de dados...');
      const recipients = await getRecipientsByUser(userId);
      console.log('✅ Destinatários carregados:', recipients.length);
      setClients(recipients);
    } catch (error) {
      console.error('Erro ao carregar destinatários:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar destinatários',
        description: 'Não foi possível carregar a lista de destinatários.'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Verificar autenticação e tipo de usuário
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const data = await getUserDocument(currentUser.uid);
        setUserData(data);
        
        // Verificar se é motorista ou cliente
        if (data?.userType !== 'motorista' && data?.userType !== 'cliente') {
          router.push('/dashboard');
          return;
        }
        
        await loadClients(currentUser.uid);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router, loadClients]);

  const handleFormSubmit = async (data: ClientFormData) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      console.log('💾 Salvando destinatário:', data);
      
      if (editingClient) {
        // Atualizar destinatário existente
        await updateRecipient(
          editingClient.id,
          data.name,
          data.address,
          data.phone
        );
        console.log('✅ Destinatário atualizado no banco de dados');
      } else {
        // Criar novo destinatário
        await createRecipient(
          user.uid,
          data.name,
          data.address,
          data.phone
        );
        console.log('✅ Novo destinatário criado no banco de dados');
      }
      
      toast({
        title: 'Sucesso!',
        description: editingClient ? 'Destinatário atualizado com sucesso!' : 'Destinatário cadastrado com sucesso!'
      });
      
      setIsDialogOpen(false);
      setEditingClient(null);
      form.reset();
      await loadClients(user.uid);
    } catch (error) {
      console.error('Erro ao salvar destinatário:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o destinatário.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    form.reset({
      name: client.name,
      phone: client.phone || '',
      address: client.address
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (clientId: string) => {
    if (!user) return;
    
    try {
      console.log('🗑️ Excluindo destinatário:', clientId);
      await deleteRecipient(clientId);
      console.log('✅ Destinatário excluído do banco de dados');
      
      toast({
        title: 'Sucesso!',
        description: 'Destinatário excluído com sucesso!'
      });
      
      await loadClients(user.uid);
    } catch (error) {
      console.error('Erro ao excluir destinatário:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o destinatário.'
      });
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingClient(null);
    form.reset();
  };

  const handleCepSearch = async (cep: string) => {
    // Remove caracteres não numéricos
    const cleanCep = cep.replace(/\D/g, '');
    
    // Verifica se o CEP tem 8 dígitos
    if (cleanCep.length !== 8) return;
    
    setIsFetchingCep(true);
    
    try {
      const addressData = await getAddressFromCEP(cleanCep);
      
      if (addressData.erro) {
        toast({
          variant: 'destructive',
          title: 'CEP não encontrado',
          description: 'O CEP informado não foi encontrado. Verifique e tente novamente.'
        });
        return;
      }
      
      // Preenche automaticamente os campos de endereço
      form.setValue('address.street', addressData.logradouro);
      form.setValue('address.neighborhood', addressData.bairro);
      form.setValue('address.city', addressData.localidade);
      form.setValue('address.state', addressData.uf);
      form.setValue('address.cep', addressData.cep);
      
      toast({
        title: 'Endereço encontrado!',
        description: 'Os dados do endereço foram preenchidos automaticamente.'
      });
      
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao buscar CEP',
        description: 'Não foi possível buscar o endereço. Tente novamente.'
      });
    } finally {
      setIsFetchingCep(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.address.street.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.address.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || !user) {
    return (
      <div className="space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </motion.div>
        
        <div className="grid gap-6">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
      >
        <div className="flex items-center space-x-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <Users className="h-6 w-6 text-white group-hover:scale-110 transition-transform duration-300" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Destinatários</h1>
            <p className="text-gray-600">
              {userData?.userType === 'cliente' 
                ? 'Gerencie seus destinatários para entregas'
                : 'Gerencie seus destinatários de entregas'
              }
            </p>
          </div>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                form.reset();
                setEditingClient(null);
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Destinatário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? 'Editar Destinatário' : 'Novo Destinatário'}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(11) 99999-9999" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Endereço</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="address.street"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Rua *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome da rua" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="address.number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número *</FormLabel>
                          <FormControl>
                            <Input placeholder="123" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="address.neighborhood"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bairro *</FormLabel>
                          <FormControl>
                            <Input placeholder="Centro" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="address.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade *</FormLabel>
                          <FormControl>
                            <Input placeholder="São Paulo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="address.state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado *</FormLabel>
                          <FormControl>
                            <Input placeholder="SP" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="address.cep"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CEP</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                placeholder="01234-567" 
                                {...field}
                                onChange={(e) => {
                                  // Formata o CEP automaticamente
                                  let value = e.target.value.replace(/\D/g, '');
                                  if (value.length > 5) {
                                    value = value.replace(/(\d{5})(\d{3})/, '$1-$2');
                                  }
                                  field.onChange(value);
                                  
                                  // Busca automática quando o CEP tem 8 dígitos
                                  const cleanCep = value.replace(/\D/g, '');
                                  if (cleanCep.length === 8) {
                                    handleCepSearch(cleanCep);
                                  }
                                }}
                                className="pr-10"
                                maxLength={9}
                              />
                              {isFetchingCep && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-gray-500 mt-1">
                            Digite o CEP para buscar o endereço automaticamente
                          </p>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isSubmitting ? 'Salvando...' : (editingClient ? 'Atualizar' : 'Cadastrar')}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Search and Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            <Users className="h-3 w-3 mr-1" />
            {clients.length} destinatário{clients.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </motion.div>

      {/* Clients List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Lista de Destinatários</CardTitle>
            <CardDescription>
              Gerencie seus destinatários de entregas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredClients.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Endereço</TableHead>
                      <TableHead>Observações</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-500" />
                              {client.name}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {client.phone && (
                              <div className="text-sm flex items-center gap-1">
                                <Phone className="h-3 w-3 text-gray-500" />
                                {client.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-gray-500" />
                              {client.address.street}, {client.address.number}
                            </div>
                            <div className="text-gray-500">
                              {client.address.neighborhood}, {client.address.city}/{client.address.state}
                            </div>
                            {client.address.cep && (
                              <div className="text-gray-500">
                                CEP: {client.address.cep}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-400 text-sm">-</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(client)}
                              className="h-8 w-8"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Destinatário</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o destinatário &quot;{client.name}&quot;? 
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(client.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'Nenhum destinatário encontrado' : 'Nenhum destinatário cadastrado'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm 
                    ? 'Tente ajustar os termos de busca.' 
                    : 'Comece cadastrando seu primeiro destinatário.'
                  }
                </p>
                {!searchTerm && (
                  <Button 
                    onClick={() => setIsDialogOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Primeiro Destinatário
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function ClientesPageWrapper() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ClientesPage />
    </Suspense>
  );
}
