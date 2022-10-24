import messages from 'locales/messages';
import React from 'react';
import type { RouteComponentProps } from 'react-router';
import { withRouter } from 'react-router';
import { PerspectiveSelect } from 'routes/views/components/perspective/perspectiveSelect';

// Infrastructure AWS options
const infrastructureAwsOptions = [{ label: messages.perspectiveValues, value: 'aws' }];

// Infrastructure AWS filtered by OpenShift options
const infrastructureAwsOcpOptions = [{ label: messages.perspectiveValues, value: 'aws_ocp' }];

// Infrastructure Azure options
const infrastructureAzureOptions = [{ label: messages.perspectiveValues, value: 'azure' }];

// Infrastructure Oci options
const infrastructureOciOptions = [{ label: messages.perspectiveValues, value: 'oci' }];

// Infrastructure Azure filtered by OpenShift options
const infrastructureAzureOcpOptions = [{ label: messages.perspectiveValues, value: 'azure_ocp' }];

// Infrastructure GCP options
const infrastructureGcpOptions = [{ label: messages.perspectiveValues, value: 'gcp' }];

// Infrastructure GCP filtered by OCP options
const infrastructureGcpOcpOptions = [{ label: messages.perspectiveValues, value: 'gcp_ocp' }];

// Infrastructure IBM options
const infrastructureIbmOptions = [{ label: messages.perspectiveValues, value: 'ibm' }];

// Infrastructure IBM filtered by OCP options
const infrastructureIbmOcpOptions = [{ label: messages.perspectiveValues, value: 'ibm_ocp' }];

// Infrastructure Ocp cloud options
const infrastructureOcpCloudOptions = [{ label: messages.perspectiveValues, value: 'ocp_cloud' }];

// Ocp options
const ocpOptions = [{ label: messages.perspectiveValues, value: 'ocp' }];

interface OverviewPerspectiveProps extends RouteComponentProps<void> {
  currentItem?: string;
  hasAws?: boolean;
  hasAwsOcp?: boolean;
  hasAzure?: boolean;
  hasAzureOcp?: boolean;
  hasGcp?: boolean;
  hasGcpOcp?: boolean;
  hasIbm?: boolean;
  hasIbmOcp?: boolean;
  hasOci?: boolean;
  hasOcp?: boolean;
  hasOcpCloud?: boolean;
  isDisabled?: boolean;
  isIbmFeatureEnabled?: boolean;
  isOciFeatureEnabled?: boolean;
  isInfrastructureTab?: boolean; // Used by the overview page
  onSelected?: (value: string) => void;
}

const getInfrastructureOptions = ({
  hasAws,
  hasAwsOcp,
  hasAzure,
  hasAzureOcp,
  hasGcp,
  hasGcpOcp,
  hasIbm,
  hasIbmOcp,
  hasOci,
  isIbmFeatureEnabled,
  isOciFeatureEnabled,
}) => {
  const options = [];

  if (hasAws) {
    options.push(...infrastructureAwsOptions);
  }
  if (hasAwsOcp) {
    options.push(...infrastructureAwsOcpOptions);
  }
  if (hasGcp) {
    options.push(...infrastructureGcpOptions);
  }
  if (hasGcpOcp) {
    options.push(...infrastructureGcpOcpOptions);
  }
  if (hasIbm) {
    options.push(...infrastructureIbmOptions);
  }
  if (hasIbmOcp && isIbmFeatureEnabled) {
    options.push(...infrastructureIbmOcpOptions);
  }
  if (hasAzure) {
    options.push(...infrastructureAzureOptions);
  }
  if (hasAzureOcp) {
    options.push(...infrastructureAzureOcpOptions);
  }
  if (hasOci && isOciFeatureEnabled) {
    options.push(...infrastructureOciOptions);
  }
  return options;
};

const OverviewPerspectiveBase: React.FC<OverviewPerspectiveProps> = ({
  currentItem,
  hasAws,
  hasAwsOcp,
  hasAzure,
  hasAzureOcp,
  hasGcp,
  hasGcpOcp,
  hasIbm,
  hasIbmOcp,
  hasOci,
  hasOcp,
  hasOcpCloud,
  isDisabled,
  isIbmFeatureEnabled,
  isInfrastructureTab,
  isOciFeatureEnabled,
  onSelected,
}): any => {
  // Dynamically show options if providers are available
  const options = [];

  if (isInfrastructureTab !== undefined) {
    if (isInfrastructureTab) {
      if (hasOcpCloud) {
        options.push(...infrastructureOcpCloudOptions);
      }
      options.push(
        ...getInfrastructureOptions({
          hasAws,
          hasAwsOcp,
          hasAzure,
          hasAzureOcp,
          hasGcp,
          hasGcpOcp,
          hasIbm,
          hasIbmOcp,
          hasOci,
          isIbmFeatureEnabled,
          isOciFeatureEnabled,
        })
      );
    } else if (hasOcp) {
      options.push(...ocpOptions);
    }
  } else {
    if (hasOcp) {
      options.push(...ocpOptions);
    }
    if (hasOcpCloud) {
      options.push(...infrastructureOcpCloudOptions);
    }
    options.push(
      ...getInfrastructureOptions({
        hasAws,
        hasAwsOcp,
        hasAzure,
        hasAzureOcp,
        hasGcp,
        hasGcpOcp,
        hasIbm,
        hasIbmOcp,
        hasOci,
        isIbmFeatureEnabled,
        isOciFeatureEnabled,
      })
    );
  }

  return (
    <PerspectiveSelect
      currentItem={currentItem || options[0].value}
      isDisabled={isDisabled}
      onSelected={onSelected}
      options={options}
    />
  );
};

const Perspective = withRouter(OverviewPerspectiveBase);

export default Perspective;
