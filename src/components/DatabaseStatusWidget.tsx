import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, RefreshCw, Server, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useDatabase } from '@/context/DatabaseContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function DatabaseStatusWidget() {
  const { 
    databaseType, 
    setDatabaseType, 
    firebaseConnected, 
    checkFirebaseConnection,
    isTesting,
  } = useDatabase();
  
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleTestConnection = async () => {
    await checkFirebaseConnection();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <div className="space-y-1">
            <h3 className="font-medium">Firebase Connection</h3>
            <div className="flex items-center gap-2">
              <Badge variant={databaseType === 'auto' ? 'secondary' : 'default'}>
                {databaseType === 'auto' ? 'Auto' : 'Firebase Only'}
              </Badge>
              <Badge variant={firebaseConnected ? 'default' : 'destructive'}>
                {firebaseConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            disabled={isTesting}
          >
            {isTesting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Test Connection
          </Button>
          <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="secondary">View Details</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Database Connection Details</DialogTitle>
                <DialogDescription>
                  Information about your Firebase database connection.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 pt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-primary" />
                      <span>Active Database:</span>
                    </div>
                    <Badge variant={databaseType === 'auto' ? 'secondary' : 'default'}>
                      {databaseType === 'auto' ? 'Auto' : 'Firebase Only'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-blue-500" />
                      <span>Firebase Status:</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {firebaseConnected ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span>{firebaseConnected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Database Mode</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant={databaseType === 'auto' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setDatabaseType('auto')}
                    >
                      Auto
                    </Button>
                    <Button 
                      variant={databaseType === 'firebase' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setDatabaseType('firebase')}
                    >
                      Firebase Only
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

export default DatabaseStatusWidget; 