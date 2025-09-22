import { 
  Button, 
  AnimatedDialog, 
  AnimatedDialogContent, 
  AnimatedDialogHeader, 
  AnimatedDialogTitle, 
  AnimatedDialogDescription, 
  AnimatedDialogFooter 
} from "@/components";
import { UseHistoryType } from "@/hooks/useHistory";

export const DeleteConfirmationDialog = ({
  deleteConfirm,
  cancelDelete,
  confirmDelete,
}: UseHistoryType) => {
  return (
    <AnimatedDialog open={!!deleteConfirm} onOpenChange={(open) => !open && cancelDelete()}>
      <AnimatedDialogContent>
        <AnimatedDialogHeader>
          <AnimatedDialogTitle>Delete Conversation</AnimatedDialogTitle>
          <AnimatedDialogDescription>
            Are you sure you want to delete this conversation? This action cannot be undone.
          </AnimatedDialogDescription>
        </AnimatedDialogHeader>
        <AnimatedDialogFooter>
          <Button variant="outline" onClick={cancelDelete}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirmDelete}>
            Delete
          </Button>
        </AnimatedDialogFooter>
      </AnimatedDialogContent>
    </AnimatedDialog>
  );
};
