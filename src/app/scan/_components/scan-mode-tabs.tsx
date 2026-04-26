import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type ScanMode,
  useScanDraftActions,
  useScanDraftStore,
} from "../_providers/scan-provider";

export function ScanModeTabs() {
  const mode = useScanDraftStore((state) => state.mode);
  const { setMode } = useScanDraftActions();

  return (
    <Tabs value={mode} onValueChange={(value) => setMode(value as ScanMode)}>
      <TabsList className="bg-white/10">
        <TabsTrigger
          value="document"
          className="data-[state=active]:bg-white data-[state=active]:text-black"
        >
          Document
        </TabsTrigger>
        <TabsTrigger
          value="id"
          className="data-[state=active]:bg-white data-[state=active]:text-black"
        >
          ID Card
        </TabsTrigger>
        <TabsTrigger
          value="photo"
          className="data-[state=active]:bg-white data-[state=active]:text-black"
        >
          Photo
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
