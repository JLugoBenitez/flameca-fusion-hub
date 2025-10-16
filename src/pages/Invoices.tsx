import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHoldedInvoices } from "@/hooks/useHoldedInvoices";
import { useWooCommerceOrders } from "@/hooks/useWooCommerceOrders";
import { 
  FileText, 
  Download, 
  DollarSign, 
  Search, 
  Filter, 
  RefreshCw,
  Plus,
  ExternalLink,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle
} from "lucide-react";

interface Invoice {
  id: string;
  order_id: string;
  holded_invoice_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    sku?: string;
  }>;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

const statusLabels = {
  draft: "Borrador",
  sent: "Enviada",
  paid: "Pagada",
  cancelled: "Cancelada",
};

const statusColors = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const statusIcons = {
  draft: Clock,
  sent: AlertCircle,
  paid: CheckCircle,
  cancelled: XCircle,
};

export default function Invoices() {
  const { 
    invoices, 
    loading, 
    fetchInvoices, 
    createInvoice, 
    syncWooCommerceOrders,
    updateInvoiceStatus 
  } = useHoldedInvoices();
  
  const { orders, fetchOrders } = useWooCommerceOrders();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchInvoices();
    fetchOrders();
  }, [fetchInvoices, fetchOrders]);

  const handleSyncOrders = async () => {
    setSyncing(true);
    try {
      await syncWooCommerceOrders();
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateInvoice = async (orderId: string) => {
    const order = (orders || []).find(o => o.id === orderId);
    if (!order) return;

    try {
      await createInvoice({
        order_id: orderId,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        items: (order.items || []).map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.unit_price,
          sku: item.sku
        })),
        total: order.total_amount,
        notes: `Factura para pedido ${orderId}`
      });
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  };

  const handleUpdateStatus = async (invoiceId: string, newStatus: Invoice['status']) => {
    try {
      await updateInvoiceStatus(invoiceId, newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const filteredInvoices = (invoices || []).filter(invoice => {
    const matchesSearch = 
      invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.holded_invoice_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const ordersWithoutInvoices = (orders || []).filter(order => 
    !(invoices || []).some(invoice => invoice.order_id === order.id)
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Facturación
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona facturas con Holded y sincroniza con WooCommerce
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleSyncOrders}
            disabled={syncing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </Button>
          <Button onClick={fetchInvoices} variant="outline">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Borradores</span>
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {(invoices || []).filter(i => i.status === 'draft').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Enviadas</span>
            </div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
              {(invoices || []).filter(i => i.status === 'sent').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-700 dark:text-green-300">Pagadas</span>
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
              {(invoices || []).filter(i => i.status === 'paid').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Total</span>
            </div>
            <div className="text-2xl font-bold text-primary mt-1">
              {formatCurrency((invoices || []).reduce((sum, invoice) => sum + invoice.total_amount, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="invoices">Facturas ({(invoices || []).length})</TabsTrigger>
          <TabsTrigger value="orders">Pedidos sin Facturar ({ordersWithoutInvoices.length})</TabsTrigger>
        </TabsList>

        {/* Facturas */}
        <TabsContent value="invoices" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por cliente, email o ID de factura..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="sent">Enviada</SelectItem>
                <SelectItem value="paid">Pagada</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invoices List */}
          <div className="grid gap-4">
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Cargando facturas...</p>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No se encontraron facturas</p>
                <p className="text-sm">Las facturas aparecerán aquí una vez creadas</p>
              </div>
            ) : (
              filteredInvoices.map((invoice, index) => {
                const StatusIcon = statusIcons[invoice.status];
                return (
                  <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <StatusIcon className="h-5 w-5 text-muted-foreground" />
                            <h3 className="font-semibold">{invoice.customer_name}</h3>
                            <Badge className={statusColors[invoice.status]}>
                              {statusLabels[invoice.status]}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                            <div>
                              <span className="font-medium">Email:</span> {invoice.customer_email}
                            </div>
                            <div>
                              <span className="font-medium">ID Holded:</span> {invoice.holded_invoice_id}
                            </div>
                            <div>
                              <span className="font-medium">Fecha:</span> {formatDate(invoice.created_at)}
                            </div>
                          </div>
                          
                          <div className="text-sm">
                            <span className="font-medium">Productos:</span> {(invoice.items || []).length} items
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-3">
                          <div className="text-2xl font-bold text-primary">
                            {formatCurrency(invoice.total_amount)}
                          </div>
                          
                          <div className="flex gap-2">
                            <Select 
                              value={invoice.status} 
                              onValueChange={(value: Invoice['status']) => handleUpdateStatus(invoice.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="draft">Borrador</SelectItem>
                                <SelectItem value="sent">Enviada</SelectItem>
                                <SelectItem value="paid">Pagada</SelectItem>
                                <SelectItem value="cancelled">Cancelada</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Button size="sm" variant="outline">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Pedidos sin Facturar */}
        <TabsContent value="orders" className="space-y-6">
          <div className="grid gap-4">
            {ordersWithoutInvoices.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Todos los pedidos tienen factura</p>
                <p className="text-sm">Los nuevos pedidos aparecerán aquí</p>
              </div>
            ) : (
              ordersWithoutInvoices.map((order) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <h3 className="font-semibold">{order.customer_name}</h3>
                          <Badge variant="outline">Sin facturar</Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Email:</span> {order.customer_email}
                          </div>
                          <div>
                            <span className="font-medium">Pedido:</span> #{order.id}
                          </div>
                          <div>
                            <span className="font-medium">Fecha:</span> {formatDate(order.created_at)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-3">
                        <div className="text-2xl font-bold text-primary">
                          {formatCurrency(order.total_amount)}
                        </div>
                        
                        <Button 
                          onClick={() => handleCreateInvoice(order.id)}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Crear Factura
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}