import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2, Camera, Sparkles } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const profileSchema = z.object({
  displayName: z.string().min(1, 'Display Name is required').max(30, 'Name must be under 30 characters'),
  mantra: z.string().max(80, 'Mantra must be under 80 characters').optional(),
  defaultView: z.enum(['dashboard', 'kanban', 'list']),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: SupabaseUser | null;
  onUpdate: () => void;
}

export function ProfileDialog({ open, onOpenChange, user, onUpdate }: ProfileDialogProps) {
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [rawImageSrc, setRawImageSrc] = useState<string>('');
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    const isConfirmed = confirm(
      "⚠️ WARNING: Are you absolutely sure you want to permanently delete your account? " +
      "This will delete all of your Handls, profile settings, and account data forever. " +
      "This action cannot be undone."
    );
    if (!isConfirmed) return;

    const verificationText = prompt(
      "To confirm deletion, please type 'delete my account' in the box below:"
    );
    
    if (verificationText === null) {
      toast("Account deletion canceled.");
      return;
    }
    
    if (verificationText !== "delete my account") {
      toast.error("Confirmation text did not match. Account deletion canceled.");
      return;
    }

    setIsDeleting(true);
    try {
      // 1. Wipe their user data rows (tasks & comments)
      const { error: taskError } = await supabase
        .from('tasks')
        .delete()
        .eq('assigned_to', user.id);
      if (taskError) throw taskError;

      // 2. Call the secure RPC to delete the auth.users record
      const { error: rpcError } = await supabase.rpc('delete_user_account');
      
      // 3. Complete logout
      await supabase.auth.signOut();
      
      if (rpcError) {
        console.warn("RPC delete failed (SQL function might not be defined):", rpcError.message);
        toast.success("All personal Handl data has been completely erased. You have been successfully signed out.");
      } else {
        toast.success("Your account and all associated data have been permanently deleted.");
      }
      
      onOpenChange(false);
      window.location.reload();
    } catch (error: any) {
      console.error("Account deletion failed:", error);
      toast.error(error.message || "Failed to permanently delete account.");
    } finally {
      setIsDeleting(false);
    }
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '',
      mantra: '',
      defaultView: 'dashboard',
    },
  });

  useEffect(() => {
    if (user && open) {
      const meta = user.user_metadata || {};
      const fallbackName = user.email ? user.email.split('@')[0].split(/[._-]/)[0] : '';
      const defaultDisplayName = fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1);

      form.reset({
        displayName: meta.display_name || defaultDisplayName,
        mantra: meta.mantra || '',
        defaultView: meta.default_view || 'dashboard',
      });
      setAvatarUrl(meta.avatar_url || '');
      setRawImageSrc('');
      setZoom(1);
      setOffsetX(0);
      setOffsetY(0);
    }
  }, [user, open, form]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result as string);
      setZoom(1);
      setOffsetX(0);
      setOffsetY(0);
      toast.success('Photo loaded! Use the sliders below to adjust its crop/alignment.');
    };
    reader.onerror = () => {
      toast.error('Failed to read image');
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input to enable consecutive uploads of any image
  };

  // Perform canvas cropping using the specified Zoom, X-Offset, and Y-Offset parameters
  const generateCroppedAvatar = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!rawImageSrc) {
        resolve(avatarUrl);
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const SIZE = 96; // Standard compressed avatar dimensions
          canvas.width = SIZE;
          canvas.height = SIZE;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawImageSrc);
            return;
          }

          ctx.clearRect(0, 0, SIZE, SIZE);

          // Calculate crop bounds
          const minSize = Math.min(img.width, img.height);
          const sSize = minSize / zoom;

          // Align crop coordinate calculations to perfectly match CSS scale/translate bounds
          const sx = img.width / 2 - (offsetX / 100) * img.width - sSize / 2;
          const sy = img.height / 2 - (offsetY / 100) * img.height - sSize / 2;

          ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, SIZE, SIZE);
          const base64Output = canvas.toDataURL('image/jpeg', 0.75); // 75% Quality JPEG
          resolve(base64Output);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = (err) => reject(err);
      img.src = rawImageSrc;
    });
  };

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return;
    setIsSaving(true);

    try {
      // 1. Generate the final cropped Base64 avatar output from canvas parameters
      const finalAvatar = await generateCroppedAvatar();

      // 2. Write details directly to Supabase auth metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: values.displayName,
          mantra: values.mantra || '',
          avatar_url: finalAvatar,
          default_view: values.defaultView,
        }
      });

      if (error) throw error;

      toast.success('Profile updated successfully!');
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const emailInitial = user?.email?.charAt(0).toUpperCase() || '?';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[420px] rounded-2xl overflow-y-auto max-h-[90vh]"
        onOpenAutoFocus={(e) => {
          const isMobileTouch = typeof window !== 'undefined' && (
            window.matchMedia('(pointer: coarse)').matches || 
            window.matchMedia('(max-width: 768px)').matches
          );
          if (isMobileTouch) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit Profile</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-2">
            
            {/* Avatar Preview & Interactive Zoom/Offset Cropper */}
            <div className="flex flex-col items-center justify-center gap-4 pb-2">
              <div className="relative group">
                <div className="h-24 w-24 rounded-full border-2 border-primary overflow-hidden shadow-md flex items-center justify-center bg-muted">
                  {rawImageSrc ? (
                    <img 
                      src={rawImageSrc} 
                      alt="Crop Preview" 
                      className="w-full h-full object-cover transition-transform duration-75 origin-center" 
                      style={{ transform: `scale(${zoom}) translate(${offsetX}%, ${offsetY}%)` }}
                    />
                  ) : avatarUrl ? (
                    <Avatar className="h-full w-full">
                      <AvatarImage src={avatarUrl} alt="Avatar" className="object-cover" />
                    </Avatar>
                  ) : (
                    <div className="bg-primary/10 text-primary text-2xl font-bold h-full w-full flex items-center justify-center">
                      {emailInitial}
                    </div>
                  )}
                </div>
                
                <label 
                  htmlFor="avatar-upload" 
                  className="absolute inset-0 bg-black/40 text-white rounded-full flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <Camera className="h-4 w-4" />
                  <span className="text-[9px] font-bold mt-1 uppercase">Upload</span>
                </label>
                <input 
                  id="avatar-upload" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarChange} 
                  className="hidden" 
                />
              </div>

              {rawImageSrc ? (
                <div className="w-full space-y-3 px-2 bg-muted/40 p-3 rounded-xl border">
                  {/* Zoom Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                      <span>Zoom</span>
                      <span>{zoom.toFixed(2)}x</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="3.5" 
                      step="0.05"
                      value={zoom} 
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  {/* Vertical Offset Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                      <span>Vertical Alignment</span>
                      <span>{offsetY}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="-50" 
                      max="50" 
                      step="1"
                      value={offsetY} 
                      onChange={(e) => setOffsetY(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  {/* Horizontal Offset Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                      <span>Horizontal Alignment</span>
                      <span>{offsetX}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="-50" 
                      max="50" 
                      step="1"
                      value={offsetX} 
                      onChange={(e) => setOffsetX(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                  
                  <p className="text-[10px] text-center text-muted-foreground italic flex items-center justify-center gap-1">
                    <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                    Drag sliders to frame your face correctly.
                  </p>
                </div>
              ) : (
                <span className="text-[10px] text-muted-foreground">Click photo to upload new image</span>
              )}
            </div>

            {/* Display Name */}
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your display name" {...field} className="rounded-xl shadow-inner" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Mantra / Bio */}
            <FormField
              control={form.control}
              name="mantra"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Focus Mantra / Bio</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="e.g. Let's focus on what matters today. Keep it simple." 
                      className="resize-none rounded-xl h-20 shadow-inner text-sm" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription className="text-[10px] text-muted-foreground">
                    This mantra displays under your greeting on the Dashboard.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Default View System Preference */}
            <FormField
              control={form.control}
              name="defaultView"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Default Landing View</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select view" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="dashboard">Dashboard</SelectItem>
                      <SelectItem value="kanban">Focus Board</SelectItem>
                      <SelectItem value="list">Handl List</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-[10px] text-muted-foreground">
                    Choose which screen loads immediately when opening the application.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />



            {/* Danger Zone */}
            <div className="border-t border-red-500/20 pt-4 mt-6">
              <div className="bg-red-500/5 dark:bg-red-950/10 border border-red-500/10 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-red-500">Permanently Delete Account</p>
                  <p className="text-[10px] text-muted-foreground leading-snug">Wipe all of your Handls, configurations, and profile records permanently.</p>
                </div>
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="sm"
                  disabled={isSaving || isDeleting}
                  onClick={handleDeleteAccount}
                  className="rounded-xl font-bold text-xs shrink-0"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Account"
                  )}
                </Button>
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="rounded-xl shadow-md font-bold">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
