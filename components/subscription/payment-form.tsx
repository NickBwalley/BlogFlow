"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CreditCard, Lock, Shield } from "lucide-react";
import {
  SUBSCRIPTION_PLANS,
  TEST_CARD_DETAILS,
  type SubscriptionPlan,
} from "@/lib/subscription/config";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { handleApiError } from "@/lib/utils/rate-limit-toast";

interface PaymentFormProps {
  selectedPlan: SubscriptionPlan;
  onBack: () => void;
  onSuccess?: () => void;
}

export function PaymentForm({
  selectedPlan,
  onBack,
  onSuccess,
}: PaymentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvc: "",
    holderName: "",
  });

  const plan = SUBSCRIPTION_PLANS[selectedPlan];

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;

    // Format card number with spaces
    if (field === "cardNumber") {
      formattedValue = value
        .replace(/\s/g, "")
        .replace(/(.{4})/g, "$1 ")
        .trim();
      if (formattedValue.length > 19) return; // Max length for formatted card number
    }

    // Format expiry date
    if (field === "expiryDate") {
      formattedValue = value.replace(/\D/g, "").replace(/(\d{2})/, "$1/");
      if (formattedValue.length > 5) return; // Max length MM/YY
    }

    // Format CVC
    if (field === "cvc") {
      formattedValue = value.replace(/\D/g, "");
      if (formattedValue.length > 3) return; // Max length for CVC
    }

    setFormData((prev) => ({
      ...prev,
      [field]: formattedValue,
    }));
  };

  const fillTestData = () => {
    setFormData({
      cardNumber: TEST_CARD_DETAILS.number,
      expiryDate: TEST_CARD_DETAILS.expiry,
      cvc: TEST_CARD_DETAILS.cvc,
      holderName: "John Doe",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/subscription/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planType: selectedPlan,
          paymentData: {
            cardNumber: formData.cardNumber.replace(/\s/g, ""),
            expiryDate: formData.expiryDate,
            cvc: formData.cvc,
            holderName: formData.holderName,
          },
        }),
      });

      // Handle rate limit errors with toast notification
      if (response.status === 429) {
        await handleApiError(response);
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Payment failed");
      }

      toast.success(result.message || "Subscription created successfully!");

      // Trigger sidebar refresh
      if (onSuccess) {
        onSuccess();
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Payment failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Plans
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Order Summary
            </CardTitle>
            <CardDescription>Review your subscription details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">{plan.name} Plan</span>
              <span className="font-bold">{plan.priceFormatted}/month</span>
            </div>

            <div className="border-t pt-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>✅ 30-day free trial included</p>
                <p>✅ Cancel anytime</p>
                <p>✅ Immediate access to all features</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center font-bold">
                <span>Today&apos;s Total</span>
                <span className="text-green-600">$0.00</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Free trial for 30 days, then {plan.priceFormatted}/month
              </p>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-sm mb-2">
                What you&apos;ll get:
              </h4>
              <ul className="text-xs space-y-1">
                {plan.features.map((feature, index) => (
                  <li key={index}>• {feature}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Information
            </CardTitle>
            <CardDescription>
              This is a demo - use the test card details below
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Test Card Info */}
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">Test Card Details</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={fillTestData}
                >
                  Use Test Data
                </Button>
              </div>
              <div className="text-xs space-y-1 text-gray-600">
                <p>
                  <strong>Card:</strong> {TEST_CARD_DETAILS.number}
                </p>
                <p>
                  <strong>Exp:</strong> {TEST_CARD_DETAILS.expiry}
                </p>
                <p>
                  <strong>CVC:</strong> {TEST_CARD_DETAILS.cvc}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="holderName">Cardholder Name</Label>
                <Input
                  id="holderName"
                  placeholder="John Doe"
                  value={formData.holderName}
                  onChange={(e) =>
                    handleInputChange("holderName", e.target.value)
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="4242 4242 4242 4242"
                  value={formData.cardNumber}
                  onChange={(e) =>
                    handleInputChange("cardNumber", e.target.value)
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    placeholder="01/27"
                    value={formData.expiryDate}
                    onChange={(e) =>
                      handleInputChange("expiryDate", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvc">CVC</Label>
                  <Input
                    id="cvc"
                    placeholder="123"
                    value={formData.cvc}
                    onChange={(e) => handleInputChange("cvc", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
                <Lock className="h-3 w-3" />
                <span>Your payment information is secure and encrypted</span>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading
                  ? "Processing..."
                  : `Start Free Trial - ${plan.priceFormatted}/month after trial`}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By subscribing, you agree to our Terms of Service and Privacy
                Policy. You can cancel your subscription at any time.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
