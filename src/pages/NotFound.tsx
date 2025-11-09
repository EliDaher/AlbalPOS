import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const NotFound = () => {
  const inventoryUser = JSON.parse(localStorage.getItem('InventoryUser'))
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <div className="mb-6">
            <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-white">404</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Page Not Found
            </h1>
            <p className="text-muted-foreground mb-6">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link to={['admin', 'dealer'].includes('admin') ? `/dashboard` : '/invoices'}>
                <Home className="mr-2 h-4 w-4" />
                {['admin', 'dealer'].includes('admin') ? 'Go to Dashboard' : 'Go to Invoices'}
              </Link>
            </Button>
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
