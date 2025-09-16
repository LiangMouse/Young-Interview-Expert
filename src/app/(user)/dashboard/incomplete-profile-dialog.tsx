import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function IncompleteProfileDialog({
  open,
  onOpenChange,
  onConfirm,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-8">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-sky-100 to-purple-100 rounded-full flex items-center justify-center">
              <Info className="w-8 h-8 text-sky-600" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-center">
            完善个人信息
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 mt-2 px-4">
            为了给您提供更精准的模拟面试体验，我们强烈建议您先上传简历完善求职信息和意向岗位。这有助于模拟面试官提供更优质服务。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 flex sm:justify-center space-x-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            稍后完善
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-gradient-to-r from-sky-500 to-purple-500 text-white"
          >
            现在就去
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
