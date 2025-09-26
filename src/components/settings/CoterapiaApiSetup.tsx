import React, { useState, useEffect, useRef } from "react";
import { Button, Header, Input, Switch } from "@/components";
import {
  KeyIcon,
  TrashIcon,
  LoaderIcon,
  ChevronDown,
  CoffeeIcon,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useApp } from "@/contexts";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components";

interface ActivationResponse {
  activated: boolean;
  error?: string;
  license_key?: string;
  instance?: {
    id: string;
    name: string;
    created_at: string;
  };
}

interface CheckoutResponse {
  success?: boolean;
  checkout_url?: string;
  error?: string;
}

interface StorageResult {
  license_key?: string;
  instance_id?: string;
  selected_coterapia_model?: string;
}

interface Model {
  provider: string;
  name: string;
  description: string;
  context_length: number;
  pricing: {
    input: number;
    output: number;
  };
}

const LICENSE_KEY_STORAGE_KEY = "coterapia_license_key";
const INSTANCE_ID_STORAGE_KEY = "coterapia_instance_id";
const SELECTED_COTERAPIA_MODEL_STORAGE_KEY = "selected_coterapia_model";

export const CoterapiaApiSetup = () => {
  const { coterapiaApiEnabled, setCoterapiaApiEnabled } = useApp();
  const [licenseKey, setLicenseKey] = useState("");
  const [instanceId, setInstanceId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [isModelsOpen, setIsModelsOpen] = useState(false);
  const [isModelsLoading, setIsModelsLoading] = useState(false);
  const modelsButtonRef = useRef<HTMLButtonElement>(null);

  // Load existing data on mount
  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const storage = await invoke<StorageResult>("get_storage");
        if (storage.license_key) {
          setLicenseKey(storage.license_key);
        }
        if (storage.instance_id) {
          setInstanceId(storage.instance_id);
        }
        if (storage.selected_coterapia_model) {
          const storedModel = JSON.parse(storage.selected_coterapia_model);
          setSelectedModel(storedModel);
        }
      } catch (error) {
        console.error("Failed to load storage data:", error);
      }
    };

    loadStorageData();
  }, []);

  // Load models when component mounts
  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    setIsModelsLoading(true);
    try {
      const modelsData = await invoke<Model[]>("get_models");
      setModels(modelsData);
    } catch (error) {
      console.error("Failed to load models:", error);
    } finally {
      setIsModelsLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      setError("Please enter a license key");
      return;
    }

    setIsActivating(true);
    setError("");
    setSuccess("");

    try {
      const response = await invoke<ActivationResponse>("activate_license", {
        licenseKey: licenseKey.trim(),
      });

      if (response.activated) {
        setSuccess("License activated successfully!");
        setLicenseKey(response.license_key || licenseKey);
        if (response.instance) {
          setInstanceId(response.instance.id);
        }
        // Auto-enable CoterapIA API when license is activated
        setCoterapiaApiEnabled(true);
      } else {
        setError(response.error || "Failed to activate license");
      }
    } catch (error) {
      console.error("Activation error:", error);
      setError("Failed to activate license. Please check your connection and try again.");
    } finally {
      setIsActivating(false);
    }
  };

  const handleModelSelect = (model: Model) => {
    setSelectedModel(model);
    setIsModelsOpen(false);
    
    // Save selected model to storage
    invoke("set_storage", {
      key: SELECTED_COTERAPIA_MODEL_STORAGE_KEY,
      value: JSON.stringify(model),
    }).catch(console.error);
  };

  const handleRemoveLicense = async () => {
    setIsLoading(true);
    try {
      await invoke("set_storage", {
        key: LICENSE_KEY_STORAGE_KEY,
        value: null,
      });
      await invoke("set_storage", {
        key: INSTANCE_ID_STORAGE_KEY,
        value: null,
      });
      
      setLicenseKey("");
      setInstanceId("");
      setSelectedModel(null);
      setSuccess("");
      setError("");
      
      // Disable CoterapIA API when license is removed
      setCoterapiaApiEnabled(false);
    } catch (error) {
      console.error("Failed to remove license:", error);
      setError("Failed to remove license");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await invoke<CheckoutResponse>("create_checkout");
      
      if (response.success && response.checkout_url) {
        await openUrl(response.checkout_url);
      } else {
        setError(response.error || "Failed to create checkout session");
      }
    } catch (error) {
      console.error("Purchase error:", error);
      setError("Failed to create checkout session. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getModelsDescription = () => {
    if (isModelsLoading) {
      return "Loading models...";
    }
    
    return models.length > 0
      ? `CoterapIA supports ${models?.length} model${
          models.length !== 1 ? "s" : ""
        } including GPT-4, Claude, and more.`
      : "Explore all the models CoterapIA supports.";
  };

  return (
    <div className="space-y-4">
      <Header
        title="Support CoterapIA"
        description="Support CoterapIA to keep the project alive, and follow on X."
      />

      {/* Purchase Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">Get CoterapIA License</h3>
            <p className="text-xs text-muted-foreground">
              Unlock premium features and support development
            </p>
          </div>
          <Button
            onClick={handlePurchase}
            disabled={isLoading}
            className="text-xs"
          >
            {isLoading ? (
              <>
                <LoaderIcon className="w-3 h-3 mr-1 animate-spin" />
                Processing...
              </>
            ) : (
              "Purchase License"
            )}
          </Button>
        </div>
      </div>

      {/* License Management Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">CoterapIA Access</h3>
            <p className="text-xs text-muted-foreground">
              CoterapIA license to unlock faster responses, quicker support and premium features.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Enter your license key"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              disabled={isActivating}
              className="flex-1"
            />
            <Button
              onClick={handleActivate}
              disabled={isActivating || !licenseKey.trim()}
              size="sm"
            >
              {isActivating ? (
                <>
                  <LoaderIcon className="w-3 h-3 mr-1 animate-spin" />
                  Activating...
                </>
              ) : (
                "Activate"
              )}
            </Button>
          </div>

          {licenseKey && (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRemoveLicense}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                {isLoading ? (
                  <>
                    <LoaderIcon className="w-3 h-3 mr-1 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <TrashIcon className="w-3 h-3 mr-1" />
                    Remove License
                  </>
                )}
              </Button>
            </div>
          )}

          {error && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
              {success}
            </div>
          )}

          {instanceId && (
            <div className="text-xs text-muted-foreground">
              Instance ID: {instanceId}
            </div>
          )}
        </div>
      </div>

      {/* Model Selection Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">Select Model</h3>
            <p className="text-xs text-muted-foreground">
              {getModelsDescription()}
            </p>
          </div>
        </div>

        <Popover open={isModelsOpen} onOpenChange={setIsModelsOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={modelsButtonRef}
              variant="outline"
              className="w-full justify-between"
              disabled={isModelsLoading}
            >
              {selectedModel ? (
                <div className="flex items-center gap-2">
                  <span className="font-medium">{selectedModel.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({selectedModel.provider})
                  </span>
                </div>
              ) : (
                "Select a model"
              )}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Search models..." />
              <CommandList>
                <CommandEmpty>No models found.</CommandEmpty>
                <CommandGroup>
                  {models.map((model) => (
                    <CommandItem
                      key={`${model.provider}-${model.name}`}
                      onSelect={() => handleModelSelect(model)}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{model.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({model.provider})
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {model.description}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {selectedModel && (
          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            <div className="font-medium">{selectedModel.name}</div>
            <div>{selectedModel.description}</div>
            <div className="mt-1">
              Context: {selectedModel.context_length.toLocaleString()} tokens
            </div>
            <div>
              Pricing: ${selectedModel.pricing.input}/1M input, ${selectedModel.pricing.output}/1M output
            </div>
          </div>
        )}
      </div>

      {/* Contact Support Section */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium">Need Help?</h3>
          <p className="text-xs text-muted-foreground">
            Contact our support team for assistance
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openUrl("mailto:support@coterapia.com")}
          >
            <CoffeeIcon className="w-3 h-3 mr-1" />
            support@coterapia.com
          </Button>
        </div>
      </div>

      {/* Toggle Section */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="space-y-1">
          <h3 className="text-sm font-medium">
            {`${coterapiaApiEnabled ? "Disable" : "Enable"} CoterapIA API`}
          </h3>
          <p className="text-xs text-muted-foreground">
            {coterapiaApiEnabled
              ? "Using all coterapia APIs for audio, and chat."
              : "A valid license is required to enable CoterapIA API or you can use your own AI Providers and STT Providers."}
          </p>
        </div>
        <Switch
          checked={coterapiaApiEnabled}
          onCheckedChange={setCoterapiaApiEnabled}
          disabled={!licenseKey && !coterapiaApiEnabled}
        />
      </div>
    </div>
  );
};
