/*
 *  Copyright 2023 Collate.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
import { Button, Checkbox, Col, Row, Space, Typography } from 'antd';
import classNames from 'classnames';
import { isObject, isString, startCase, uniqueId } from 'lodash';
import { ExtraInfo } from 'Models';
import React, { forwardRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { TAG_START_WITH } from '../../../constants/Tag.constants';
import { useTourProvider } from '../../../context/TourProvider/TourProvider';
import { EntityType } from '../../../enums/entity.enum';
import {
  GlossaryTerm,
  Status,
} from '../../../generated/entity/data/glossaryTerm';
import { Table } from '../../../generated/entity/data/table';
import { EntityReference } from '../../../generated/entity/type';
import { TagLabel } from '../../../generated/tests/testCase';
import { AssetCertification } from '../../../generated/type/assetCertification';
import { getEntityName } from '../../../utils/EntityUtils';
import { getDomainPath } from '../../../utils/RouterUtils';
import searchClassBase from '../../../utils/SearchClassBase';
import { stringToHTML } from '../../../utils/StringsUtils';
import { getUsagePercentile } from '../../../utils/TableUtils';
import CertificationTag from '../../common/CertificationTag/CertificationTag';
import { OwnerLabel } from '../../common/OwnerLabel/OwnerLabel.component';
import TitleBreadcrumb from '../../common/TitleBreadcrumb/TitleBreadcrumb.component';
import TableDataCardBody from '../../Database/TableDataCardBody/TableDataCardBody';
import { GlossaryStatusBadge } from '../../Glossary/GlossaryStatusBadge/GlossaryStatusBadge.component';
import TagsV1 from '../../Tag/TagsV1/TagsV1.component';
import './explore-search-card.less';
import { ExploreSearchCardProps } from './ExploreSearchCard.interface';

const ExploreSearchCard: React.FC<ExploreSearchCardProps> = forwardRef<
  HTMLDivElement,
  ExploreSearchCardProps
>(
  (
    {
      id,
      className,
      source,
      matches,
      showEntityIcon,
      handleSummaryPanelDisplay,
      showTags = true,
      openEntityInNewPage,
      hideBreadcrumbs = false,
      actionPopoverContent,
      showCheckboxes = false,
      checked = false,
      onCheckboxChange,
    },
    ref
  ) => {
    const { t } = useTranslation();
    const { tab } = useParams<{ tab: string }>();
    const { isTourOpen } = useTourProvider();
    const otherDetails = useMemo(() => {
      const tierValue = isString(source.tier)
        ? source.tier
        : source.tier && (
            <TagsV1
              startWith={TAG_START_WITH.SOURCE_ICON}
              tag={source.tier as TagLabel}
            />
          );

      const _otherDetails: ExtraInfo[] = [
        ...(source?.domain
          ? [
              {
                key: 'Domain',
                value: getDomainPath(source.domain.fullyQualifiedName),
                placeholderText: getEntityName(source.domain),
                isLink: true,
                openInNewTab: false,
              },
            ]
          : !searchClassBase
              .getListOfEntitiesWithoutDomain()
              .includes(source?.entityType ?? '')
          ? [
              {
                key: 'Domain',
                value: '',
              },
            ]
          : []),

        {
          key: 'Owner',
          value: (
            <OwnerLabel owners={(source?.owners as EntityReference[]) ?? []} />
          ),
        },

        ...(!searchClassBase
          .getListOfEntitiesWithoutTier()
          .includes((source?.entityType ?? '') as EntityType)
          ? [
              {
                key: 'Tier',
                value: tierValue,
              },
            ]
          : []),

        ...('usageSummary' in source
          ? [
              {
                value: getUsagePercentile(
                  source.usageSummary?.weeklyStats?.percentileRank ?? 0,
                  true
                ),
              },
            ]
          : []),
      ];

      return _otherDetails;
    }, [source]);

    const serviceIcon = useMemo(() => {
      return searchClassBase.getServiceIcon(source);
    }, [source]);

    const breadcrumbs = useMemo(
      () =>
        searchClassBase.getEntityBreadcrumbs(
          source,
          source.entityType as EntityType,
          true
        ),
      [source]
    );

    const entityIcon = useMemo(() => {
      if (showEntityIcon) {
        if (source.entityType === 'glossaryTerm') {
          if (source.style?.iconURL) {
            return (
              <img
                className="align-middle m-r-xs object-contain"
                data-testid="icon"
                height={24}
                src={source.style.iconURL}
                width={24}
              />
            );
          }

          return;
        }

        return (
          <span className="w-6 h-6 m-r-xs d-inline-flex text-xl align-middle">
            {searchClassBase.getEntityIcon(source.entityType ?? '')}
          </span>
        );
      }

      return;
    }, [source, showEntityIcon]);

    const entityLink = useMemo(
      () => searchClassBase.getEntityLink(source),
      [source]
    );

    const header = useMemo(() => {
      const hasGlossaryTermStatus =
        source.entityType === EntityType.GLOSSARY_TERM &&
        (source as GlossaryTerm).status !== Status.Approved;

      return (
        <Row gutter={[8, 8]}>
          {showCheckboxes && (
            <Col flex="25px">
              <div onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={checked}
                  className="assets-checkbox"
                  onChange={(e) => {
                    onCheckboxChange?.(e.target.checked);
                  }}
                />
              </div>
            </Col>
          )}
          {!hideBreadcrumbs && (
            <Col className="d-flex" flex="auto">
              <div className="d-flex gap-2 items-center">
                {serviceIcon}
                <div className="entity-breadcrumb" data-testid="category-name">
                  <TitleBreadcrumb
                    titleLinks={breadcrumbs}
                    widthDeductions={780}
                  />
                </div>
              </div>
            </Col>
          )}
          <Col
            data-testid={`${
              source.service?.name ? `${source.service.name}-` : 'explore-card-'
            }${source.name}`}
            span={24}>
            {isTourOpen ? (
              <Button data-testid={source.fullyQualifiedName} type="link">
                <Typography.Text
                  className="text-lg font-medium text-link-color"
                  data-testid="entity-header-display-name">
                  {stringToHTML(searchClassBase.getEntityName(source))}
                </Typography.Text>
              </Button>
            ) : (
              <div className="w-full d-flex items-center">
                {entityIcon}

                <Link
                  className={classNames('no-underline line-height-22 ', {
                    'w-max-full': !hasGlossaryTermStatus,
                    'm-r-xs': hasGlossaryTermStatus,
                  })}
                  data-testid="entity-link"
                  target={searchClassBase.getSearchEntityLinkTarget(
                    source,
                    openEntityInNewPage
                  )}
                  to={{
                    pathname: isObject(entityLink)
                      ? entityLink.pathname
                      : entityLink,
                    state: {
                      breadcrumbData: breadcrumbs.slice(0, -1),
                    },
                  }}>
                  <Typography.Text
                    className="text-lg font-medium text-link-color break-word whitespace-normal"
                    data-testid="entity-header-display-name">
                    {stringToHTML(searchClassBase.getEntityName(source))}
                  </Typography.Text>
                </Link>

                {(source as Table)?.certification && (
                  <div className="p-l-sm">
                    <CertificationTag
                      certification={
                        (source as Table).certification as AssetCertification
                      }
                    />
                  </div>
                )}

                {hasGlossaryTermStatus && (
                  <GlossaryStatusBadge
                    status={(source as GlossaryTerm).status ?? Status.Approved}
                  />
                )}
              </div>
            )}
          </Col>
        </Row>
      );
    }, [
      breadcrumbs,
      source,
      hideBreadcrumbs,
      showCheckboxes,
      checked,
      entityLink,
    ]);

    return (
      <div
        className={classNames('explore-search-card', className)}
        data-testid={'table-data-card_' + (source.fullyQualifiedName ?? '')}
        id={id}
        ref={ref}
        onClick={() => {
          handleSummaryPanelDisplay?.(source, tab);
        }}>
        {header}

        <div className="p-t-sm">
          <TableDataCardBody
            description={source.description ?? ''}
            extraInfo={otherDetails}
            tags={showTags ? source.tags : []}
          />
        </div>
        {matches && matches.length > 0 ? (
          <div
            className="p-t-sm text-grey-muted text-xs"
            data-testid="matches-stats">
            <span>{`${t('label.matches')}:`}</span>
            {matches.map((data, i) => (
              <span className="m-l-xs" key={uniqueId()}>
                {`${data.value} in ${startCase(data.key)}${
                  i !== matches.length - 1 ? ',' : ''
                }`}
              </span>
            ))}
          </div>
        ) : null}
        {actionPopoverContent && (
          <Space className="explore-card-actions">{actionPopoverContent}</Space>
        )}
      </div>
    );
  }
);

export default ExploreSearchCard;
