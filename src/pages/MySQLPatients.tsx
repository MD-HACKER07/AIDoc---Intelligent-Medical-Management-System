import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, DatabaseIcon, RefreshCcw } from 'lucide-react';
import { MySQLPatientList } from '@/components/MySQLPatientList';
import { useDatabase } from '@/context/DatabaseContext';

export function MySQLPatients() {
  const navigate = useNavigate();
  const { databaseType, checkMySQLConnection } = useDatabase();
  
  const handleRefreshConnection = async () => {
    await checkMySQLConnection();
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">MySQL Patient Management</h1>
          <p className="text-muted-foreground mt-1">
            View and manage patients stored in your MySQL database
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshConnection}
            className="flex items-center gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            <span>Refresh Connection</span>
          </Button>
          
          <Button 
            onClick={() => navigate('/add-mysql-patient')}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add New Patient</span>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle>MySQL Patients</CardTitle>
            <CardDescription>
              Manage and view patient records in the MySQL database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MySQLPatientList />
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Database Status</CardTitle>
                <DatabaseIcon className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {databaseType === 'mysql' ? 'MySQL' : 'Auto/Firebase'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Current active database
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-md border px-3 py-2">
                  <div className="text-sm font-medium">Type</div>
                  <div className="text-sm">MySQL</div>
                </div>
                <div className="rounded-md border px-3 py-2">
                  <div className="text-sm font-medium">Status</div>
                  <div className="text-sm text-green-500">Connected</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Database Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => navigate('/add-mysql-patient')}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add New Patient
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.open('php-api/database-backup.php', '_blank')}
              >
                <DatabaseIcon className="h-4 w-4 mr-2" />
                Backup Database
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default MySQLPatients; 